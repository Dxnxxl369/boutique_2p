# CONTEXTO DEL PROYECTO PARA GEMINI

Este archivo es la **fuente de verdad** para cualquier interacción con el agente IA. Seguir estas reglas es obligatorio para asegurar la calidad, eficiencia y evitar bucles de debugging.

### 1. ARQUITECTURA DEL PROYECTO Y STACK TECNOLÓGICO

-   **Estructura Lógica:** El proyecto es un sistema de TRES capas:
    -   **Backend:** Django / Python (`backend/`)
    -   **Frontend Web:** React / TypeScript (`web/`)
    -   **Mobile:** Flutter / Dart (`mobile/`)
-   **Comunicación:** La única vía de comunicación entre las capas es mediante una API REST/JSON servida por el Backend.
-   **Roles de Directorio:**
    -   `backend/`: Contiene toda la lógica de Django (Modelos, Serializers, Vistas, etc.).
    -   `web/`: Contiene la aplicación web construida con React y TypeScript.
    -   `mobile/`: Contiene la aplicación móvil construida con Flutter.

### 2. PROTOCOLO DE DEBUGGING OBLIGATORIO (Anti-Bucles)

Estas reglas son innegociables para cualquier tarea de corrección de errores:

1.  **Diagnóstico Multicapa:** Nunca propongas un cambio de código sin antes correlacionar las trazas de error de **todas las capas involucradas**. Si un error ocurre en el frontend, revisa primero la respuesta del endpoint de Django. El log de error del Backend es la fuente de verdad.
2.  **Validación del Payload:** Ante un error `400 (Bad Request)`, `ValidationError` o similar, la causa raíz casi siempre es una de dos:
    -   El `Serializer` de Django está rechazando los datos.
    -   El *payload* JSON enviado por el Frontend (React/Flutter) no coincide con la estructura que el `Serializer` espera.
3.  **Plan de Ataque:** Antes de modificar cualquier archivo, debes redactar y exponer un **Plan de Ataque** de 3 pasos:
    1.  **Identificación de Causa Raíz:** ¿Cuál es el origen exacto del problema?
    2.  **Archivos a Modificar:** Lista con rutas completas de los archivos que cambiarás.
    3.  **Lógica de la Corrección:** Descripción clara de qué vas a cambiar y por qué.
4.  **Prioridad de Corrección:** Los cambios deben fluir del **Backend al Frontend**. No intentes arreglar la interfaz hasta que el endpoint de Django funcione correctamente, devuelva el JSON esperado y su comportamiento esté verificado.

### 3. CONVENCIONES Y REGLAS DE CÓDIGO

-   **Pruebas en Backend:** Toda nueva funcionalidad o corrección de un bug crítico en el Backend debe incluir una prueba unitaria que valide el cambio.

### 4. PROTOCOLO DE INICIALIZACIÓN COMPLETA (COMANDO /init_full)

Este protocolo es obligatorio para configurar el entorno de desarrollo desde cero. Debe ejecutarse estrictamente en la secuencia descrita.

**A. CONFIGURACIÓN DEL BACKEND (DJANGO)**

1.  **Navegar al Directorio:**
    ```bash
    cd backend
    ```
2.  **Crear Archivo de Entorno `.env`:**
    Crea un archivo llamado `.env` dentro de la carpeta `backend/`. Este archivo contendrá las variables de entorno para la base de datos. `settings.py` ya está configurado para leerlo.

    Contenido del archivo `.env`:
    ```
    # Archivo: backend/.env
    DB_NAME=boutique_bd
    DB_USER=postgres
    DB_PASSWORD=password
    DB_HOST=localhost
    DB_PORT=5432
    ```

3.  **Limpiar Entorno Virtual Anterior (Opcional):**
    Si existe una carpeta `venv` en `backend/`, elimínala para asegurar una instalación limpia.
    ```powershell
    # En Windows (PowerShell)
    Remove-Item -Recurse -Force .\venv
    ```

4.  **Crear y Activar Entorno Virtual:**
    ```powershell
    # Crear
    py -m venv venv
    # Activar
    .\venv\Scripts\activate
    ```

5.  **Instalar Dependencias:**
    ```bash
    pip install -r requirements.txt
    ```

6.  **Base de Datos y Migraciones:**
    *(Asegúrate de que la base de datos `boutique_bd` exista en PostgreSQL)*.
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

7.  **Crear Usuarios y Datos de Prueba:**
    ```bash
    # Crea un superusuario (admin, admin@gmail.com, pass: 12345)
    python manage.py createsuperuser --noinput --username admin --email admin@gmail.com
    # (Se te pedirá introducir la contraseña '12345' dos veces)

    # Comandos para poblar la base de datos
    python manage.py seed_data
    python manage.py create_admin
    python manage.py create_productos
    ```

8.  **Iniciar Servidor de Desarrollo:**
    ```bash
    # Inicia el servidor en segundo plano
    python manage.py runserver &
    ```

**B. CONFIGURACIÓN DEL FRONTEND (REACT)**

1.  **Navegar al Directorio (desde la raíz del proyecto):**
    ```bash
    cd web
    ```
2.  **Instalar Dependencias:**
    ```bash
    npm install
    ```
3.  **Iniciar Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```

**C. RECORDATORIO CRÍTICO PARA LA APP MÓVIL**

Antes de ejecutar la aplicación en Flutter, recuerda **actualizar la dirección IP** en el archivo de configuración correspondiente para que apunte a tu servidor de desarrollo de Django.
Mi IP es: 192.168.100.7
