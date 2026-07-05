# Setup — AppMiSalud Familia

## Requisitos

- Node.js 20+
- Python 3.11+
- Cuenta Firebase

## 1. Frontend (Next.js)

```bash
cd apps/web
cp .env.example .env.local
# Llenar variables NEXT_PUBLIC_FIREBASE_* con tu proyecto Firebase
yarn install
yarn dev
# → http://localhost:3000
```

## 2. Backend (FastAPI)

```bash
cd services/api
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Llenar variables FIREBASE_* y AI keys

uvicorn main:app --reload --port 8000
# → http://localhost:8000/health
```

## 3. Firebase

1. Crear proyecto en console.firebase.google.com
2. Activar Authentication (Email/Password)
3. Activar Firestore Database
4. Activar Storage
5. Descargar Service Account key para el backend
6. Publicar reglas: `firebase deploy --only firestore:rules,storage`

## Variables de entorno

- Frontend: `apps/web/.env.example`
- Backend: `services/api/.env.example`

## Notas de desarrollo

- El backend usa `MockProvider` por defecto (sin gastar APIs de IA)
- Cambiar `AI_DEFAULT_PROVIDER=deepseek` cuando tengas las keys
- El disco C: está lleno — todo el proyecto va en E:\Proyectos\appmisalud-familia
- Configurar `TEMP=E:\temp` y `YARN_CACHE_FOLDER=E:\.yarn-cache` antes de instalar
