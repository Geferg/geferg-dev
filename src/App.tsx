import Footer from "./components/footer";
import Header from "./components/header";
import "./index.css";
import NotFoundPage from "./pages/NotFoundPage";

export function App() {
    return (
        <AppLayout>
            {renderPage(window.location.pathname)}
        </AppLayout>
    )
}

function renderPage(pathname: string) {
    switch (pathname) {
        default: return <NotFoundPage />;
    }
}

function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    )
}

export default App;
