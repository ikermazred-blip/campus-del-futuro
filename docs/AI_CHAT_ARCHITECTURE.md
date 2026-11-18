# SCHOOL AI WORLD — arquitectura de chats

## Objetivo

La interfaz del campus no debe depender de Gemini ni de un proveedor concreto. Todos los tutores y asistentes utilizan un contrato HTTP propio; el backend decide qué proveedor ejecuta cada petición.

## Arquitectura propuesta

```
Navegador (React / GitHub Pages)
  ├─ Chat UI + historial local provisional
  └─ HTTPS /v1/chat/completions
       ↓
Backend API (Cloudflare Workers / alternativa equivalente)
  ├─ Autenticación y autorización por alumno
  ├─ Límites de uso, validación y moderación
  ├─ Registro de conversaciones y mensajes
  ├─ Orquestador de agentes (tutor, modo, asignatura)
  └─ Adaptadores de proveedor
       ├─ Google Gemini
       ├─ OpenAI
       └─ Otros proveedores compatibles
       ↓
Base de datos (Postgres / Supabase)
  ├─ users
  ├─ agents
  ├─ conversations
  └─ messages
```

## Contrato del endpoint

### POST /v1/chat/completions

Request:
```json
{
  "agentId": "quimica",
  "mode": "Preparador de exámenes",
  "messages": [
    { "role": "user", "content": "Explícame los alcanos" }
  ]
}
```

Response:
```json
{
  "reply": "Los alcanos son hidrocarburos saturados...",
  "conversationId": "uuid"
}
```

El backend debe obtener el usuario desde una sesión segura; nunca aceptar un userId arbitrario del navegador. Debe persistir el mensaje del alumno y la respuesta del tutor en una transacción o flujo consistente.

## Abstracción de proveedor

Definir una interfaz interna `AIProvider.generate(messages, systemPrompt, options)`. Los adaptadores implementan esa interfaz. La selección de proveedor se configura en el servidor mediante variables secretas, no mediante variables `VITE_*`.

Variables del servidor previstas:
- `AI_PROVIDER`: gemini, openai u otro adaptador instalado.
- `AI_API_KEY`: secreto del proveedor elegido.
- `DATABASE_URL`: conexión a la base de datos.
- `AUTH_SECRET`: secreto de sesiones.

La clave privada nunca se incluye en el frontend ni en GitHub.

## Persistencia y privacidad

El historial actual del navegador es provisional. Para el producto real, el backend debe almacenar conversaciones y mensajes vinculados al usuario autenticado, con reglas de acceso por propietario. El audio no se conserva por defecto: se guarda la transcripción solo si el usuario activa esa opción. Incluir exportación y borrado de conversaciones.

## Estado de esta fase

- Interfaz de chat propia integrada en los tutores de asignatura.
- Conversaciones y mensajes guardados localmente para continuar en el mismo navegador.
- Cliente HTTP desacoplado del proveedor.
- Falta desplegar API, autenticación y base de datos para activar respuestas IA y sincronización multidispositivo.
- Los seis asistentes generales deben migrarse al mismo componente/contrato en una siguiente iteración.
