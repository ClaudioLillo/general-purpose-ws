import { APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const handler = async (event: APIGatewayRequestAuthorizerEvent) => {
  // 1. Extraer el token desde los Query Parameters de la URL de conexión
  const token = event.queryStringParameters?.token;
  const methodArn = event.methodArn; // El recurso de AWS que se intenta accionar

  if (!token) {
    console.warn("Conexión rechazada: Falta el token de autorización.");
    return generatePolicy("user", "Deny", methodArn);
  }

  try {
    // 2. Verificar la firma y la expiración del token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Opcional: Aquí podrías consultar una base de datos o caché (Redis)
    // para verificar si el userId tiene demasiadas conexiones abiertas (Rate Limiting)

    console.log(`Usuario verificado con éxito: ${decoded.userId}`);
    return generatePolicy(decoded.userId, "Allow", methodArn);
  } catch (error) {
    console.error("Token inválido o expirado:", error);
    // Si el token falló, denegamos el acceso inmediatamente para proteger tus costos
    return generatePolicy("unauthorized", "Deny", methodArn);
  }
};

// Función Helper para estructurar la respuesta requerida por AWS API Gateway
const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
) => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource, // Permite o deniega específicamente esta ruta ($connect)
        },
      ],
    },
    // Esta sección inyecta datos útiles directamente en el evento $connect posterior
    context: {
      userId: principalId,
    },
  };
};
