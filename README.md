# Ronald's Care: El Valor de estar Juntos

## 🌟 La Experiencia del Donante en el Centro

Nuestra plataforma está diseñada enfocándose por completo en el **usuario donante**. Rompemos la barrera entre la intención de ayudar y la acción directa, construyendo una experiencia unificada, transparente y profundamente gratificante. Cada característica de este proyecto busca que el usuario sea partícipe directo en el bienestar integral de la comunidad a través de regalos, recursos y su propio tiempo.

## 🎯 Características Principales (Perfil Donante)

- **Todo en un Solo Lugar (Hub Unificado):**
  Despedimos los sistemas fragmentados. El donativo monetario, el aporte periódico, las donaciones en especie (Regalos Directos) y el voluntariado convergen en una sola pantalla ágil y sin complicaciones.
  
- **Búsqueda y Filtros Inteligentes:**
  Entendemos el sentido de urgencia. A través de pestañas rápidas, los donantes pueden identificar rápidamente qué iniciativas necesitan apoyo crítico ("Urgentes", "Casi logradas", "Por completar"). Los filtros interactivos permiten buscar causas por nombre, área y requerimiento específico.

- **Donaciones en Especie Optimizadas:**
  Los donantes pueden contribuir tanto entregando regalos de manera presencial (agendando una fecha tentativa) como a través de servicios de paquetería enviando el número de rastreo. La plataforma realiza un seguimiento automático de estos aportes.
  
- **Dashboard de "Mi Impacto":**
  Fomentamos el espíritu de la solidaridad con total transparencia. A través del correo y un sistema de validación, compilamos el histórico completo de un donante, mostrando la suma de sus contribuciones financieras, horas sumadas en voluntariado y artículos aportados.
  
- **Comunicación y Seguimiento Cercano (Correos Simulados generados por IA):**
  Aportar no debe sentirse como una transacción fría. Empleamos un pipeline de Inteligencia Artificial ("gemma:2b" local) accionado de manera administrativa que redacta cartas de agradecimiento únicas e informa el destino del dinero de los donantes. Además, integra una bandeja interactiva de correos para probar y simular la experiencia completa de comunicación.

---

## 💻 Arquitectura Tecnológica y Stack

- **Frontend Interactivo:**
  - React + Vite + React Router DOM
  - Tailwind CSS + UI / UX dinámico
- **Backend Confiable:**
  - Node.js y Express Framework
  - SQLite (`better-sqlite3`) para persistencia local de datos
- **Integraciones:**
  - Servicios de Inteligencia Artificial Locales a través de **Ollama**
  - Generación de documentos (jsPDF)

---

## 🚀 Cómo Iniciar el Entorno Local

1. **Instalar Dependencias de Desarrollo**
   _En la raíz del proyecto (para el Frontend en React):_
   ```bash
   npm install
   ```
   _En la carpeta `/server` (para el Backend):_
   ```bash
   cd server
   npm install
   ```

2. **Levantar el Backend**
   ```bash
   cd server
   npm start
   ```
   El servidor de la aplicación se levantará en `http://localhost:3001` (Asegúrate de no tener este puerto ocupado).

3. **Arrancar el Frontend**
   _Abriendo otra terminal en la raíz del proyecto:_
   ```bash
   npm run dev
   ```
   Tu aplicación Vite estará lista en `http://localhost:5173`. 
   
## 🔐 Acceso de Administración

El portal maneja dos perfiles principales: el Donante Público y la Administración Operativa de la fundación interactuando con flujos de aprobación y reportes usando el código interno.

_Aclaración: El módulo CFDI incluido en el panel administrativo actualmente es un Mock de demostración para este Producto Mínimo Viable (MVP) y no emite facturación fiscal real._

---
Construido con dedicación para revolucionar la forma en que conectamos la buena voluntad de la gente y la acción concreta.