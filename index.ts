// Usamos el SDK de AWS v3 que viene por defecto en entornos runtime modernos de Node.js
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

import {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const isLocal =
  process.env.IS_OFFLINE || process.env.NODE_ENV === "development";

// 1. Variable global para almacenar la instancia del cliente
let apiGatewayClient: ApiGatewayManagementApiClient | null = null;

// 2. Función global para obtener o inicializar el cliente único
const getApiGatewayClient = (endpoint: string) => {
  if (!apiGatewayClient) {
    const isLocal =
      process.env.IS_OFFLINE || process.env.NODE_ENV === "development";

    apiGatewayClient = new ApiGatewayManagementApiClient({
      endpoint: endpoint,
      region: "us-east-1",
      // Si es local, evitamos buscar credenciales reales inyectando mocks
      credentials: isLocal
        ? { accessKeyId: "mock-id", secretAccessKey: "mock-key" }
        : undefined, // En AWS, tomará el rol de IAM automáticamente
    });
  }
  return apiGatewayClient;
};

// Función auxiliar para enviar respuestas al WebSocket
const sendToConnection = async (
  connectionId: string,
  endpoint: string,
  data: Record<string, any>,
) => {
  const client = getApiGatewayClient(endpoint);
  try {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(data),
    });
    await client.send(command);
  } catch (error) {
    console.error(`Error enviando a la conexión ${connectionId}:`, error);
  }
};

const connect = async (event: APIGatewayProxyWebsocketEventV2) => {
  console.log(`Cliente conectado: ${event.requestContext.connectionId}`);
  return { statusCode: 200, body: "Connected" };
};

const disconnect = async (event: APIGatewayProxyWebsocketEventV2) => {
  console.log(`Cliente desconectado: ${event.requestContext.connectionId}`);
  return { statusCode: 200, body: "Disconnected" };
};

const defaultHandler = async (event: APIGatewayProxyWebsocketEventV2) => {
  return { statusCode: 404, body: "Ruta no encontrada." };
};

const sendMessage = async (event: APIGatewayProxyWebsocketEventV2) => {
  const connectionId = event.requestContext.connectionId;

  // serverless-offline genera el dominio local dinámicamente aquí
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const localEndpoint = isLocal
    ? "http://localhost:3001" // Puerto por defecto de WebSockets en serverless-offline
    : `https://${domainName}/${stage}`;

  const body = event.body ? JSON.parse(event.body) : {};
  const mensajeRecibido = body.message || "";

  // Eco del mensaje de vuelta al cliente remitente
  await sendToConnection(connectionId, localEndpoint, {
    text: `Recibí tu mensaje: "${mensajeRecibido}"`,
    timestamp: new Date().toISOString(),
  });

  return { statusCode: 200, body: "Data sent." };
};

export default defaultHandler;

export { connect, disconnect, sendMessage };
