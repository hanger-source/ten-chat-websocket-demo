import React from "react";
import { StoreProvider } from "@/store";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NewHome from "@/components/NewLayout/layouts/Home";

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new-home" element={<NewHome />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors closeButton theme="light" />
    </StoreProvider>
  );
}

export default App;