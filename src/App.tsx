import Footer from "./components/footer";
import Header from "./components/header";
import "./index.css";
import NotFoundPage from "./pages/NotFoundPage";
import ProjectsPage from "./pages/projects";
import SolarSystem from "./pages/solarSystem/solarSystem";

export function App() {
    return (
        <AppLayout>
            {renderPage(window.location.pathname)}
        </AppLayout>
    )
}

function renderPage(pathname: string) {
    switch (pathname) {
        case "/": return <SolarSystem />;
        case "/projects": return <ProjectsPage />
        default: return <NotFoundPage />;
    }
}

function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="min-h-0 flex flex-1 flex-col">
                {children}
            </main>
            <Footer />
        </div>
    )
}

export default App;
