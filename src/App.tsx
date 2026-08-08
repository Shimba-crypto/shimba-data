import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Docs from "./pages/Docs";
import Usage from "./pages/Usage";
import Status from "./pages/Status";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("sd-user-token") || "");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("sd-user-token", token);
      fetch("/api/user/me", { headers: { "X-User-Token": token } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setUser(d))
        .catch(() => setUser(null));
    } else {
      localStorage.removeItem("sd-user-token");
      setUser(null);
    }
  }, [token]);

  function logout() { setToken(""); setUser(null); }

  return (
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path="/login" element={<Login onLogin={(t) => setToken(t)} />} />
      <Route path="/signup" element={<Signup onLogin={(t) => setToken(t)} />} />
      <Route element={<Layout token={token} user={user} logout={logout} />}>
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/usage" element={<Usage />} />
        <Route path="/status" element={<Status />} />
        <Route path="/dashboard" element={token ? <Dashboard token={token} user={user} onLogout={logout} /> : <Login onLogin={(t) => setToken(t)} />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
