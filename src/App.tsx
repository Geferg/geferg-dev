import "./index.css";
import NotFoundPage from "./pages/NotFoundPage";

export function App() {
    switch (window.location.pathname) {
        default: return <NotFoundPage />;
    }
}

export default App;
