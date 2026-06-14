# MarkItDown Studio

MarkItDown Studio is a professional web-based file conversion application based on the [Microsoft MarkItDown](https://github.com/microsoft/markitdown) Python library.

## Features

- **Drag & Drop Upload:** Seamlessly upload multiple files.
- **Batch Conversion:** Convert files individually or merge them into a single Markdown document.
- **Real-time Preview:** View the generated Markdown inside the application.
- **Copy & Download:** Easily copy the output or download it as `.md` files.
- **Supported Formats:** PDF, DOCX, PPTX, XLSX, CSV, HTML, TXT, JSON (and any other format natively supported by `markitdown`).

## Tech Stack

**Backend:**
- Python 3.10+
- FastAPI & Uvicorn
- Microsoft `markitdown`
- `python-multipart` (for file handling)

**Frontend:**
- React 18+
- Vite
- Vanilla CSS
- `lucide-react` (Icons)
- `framer-motion` (Animations)
- `react-markdown` (Preview)

---

## Local Setup

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables (copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be available at `http://localhost:8000`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_BASE_URL` points to your running backend (e.g., `http://localhost:8000`).
4. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.
