# SCHOOL AI WORLD — despliegue del chat

## Arquitectura

- **Frontend:** React + GitHub Pages.
- **Identidad:** Supabase Auth. El acceso no incluye registro público abierto; las cuentas las habilita un administrador autorizado.
- **Datos:** Supabase Postgres con conversaciones y mensajes, protegidos por políticas RLS por usuario.
- **API:** Supabase Edge Function `chat`; valida el JWT, comprueba la propiedad de cada conversación y limita el tamaño de los mensajes.
- **IA:** adaptadores Gemini/OpenAI. El navegador nunca recibe claves privadas.

## Preparación

1. Un adulto responsable o administrador debe crear el proyecto Supabase y custodiar sus credenciales.
2. Aplicar `supabase/migrations/202611180001_chat_schema.sql`.
3. Desplegar `supabase/functions/chat/index.ts` con verificación JWT activada.
4. Configurar los secretos del backend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_ORIGIN`, `AI_PROVIDER` y la clave privada del proveedor elegido (`GEMINI_API_KEY` u `OPENAI_API_KEY`). No guardar secretos en GitHub ni en variables `VITE_*`.
5. Crear cuentas desde la administración de Auth; no habilitar registro abierto sin revisar privacidad y consentimiento aplicable.
6. Configurar en el entorno de compilación del frontend `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, y volver a publicar GitHub Pages.

## API

- `POST /functions/v1/chat` con `agentId`, `mode`, opcional `conversationId` y un único último mensaje.
- `POST /functions/v1/chat` con `action: "list"` y `agentId` para recuperar hasta 50 conversaciones del usuario.
- `POST /functions/v1/chat` con `action: "delete"` y `conversationId` para borrar una conversación.
- La función obtiene la identidad del JWT; no acepta un `userId` arbitrario del navegador.

## Límites actuales

El código queda preparado, pero no puede desplegarse ni activarse sin un proyecto Supabase y sus secretos. El historial local anterior no se sube automáticamente. La interfaz nueva sí está preparada para recuperar el historial remoto cuando se configure la cuenta.
