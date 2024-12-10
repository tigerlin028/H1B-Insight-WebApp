import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider } from '@mui/material'
import { createTheme } from "@mui/material/styles";
import { AuthProvider } from './context/AuthContext';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import IndustryAnalysisPage from './pages/IndustryAnalysisPage';
import CompanyAnalysisPage from './pages/CompanyAnalysisPage';
import H1BAnalysisPage from './pages/H1BAnalysisPage';
import JobAnalysisPage from './pages/JobAnalysisPage';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#990000', // Penn Red
    },
    secondary: {
      main: '#011F5B', // Penn Blue
    },
    background: {
      default: '#FFFFFF', // White background
    }
  },
});


export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/industry" element={<IndustryAnalysisPage />} />
            <Route path="/companies" element={<CompanyAnalysisPage />} />
            <Route path="/h1b" element={<H1BAnalysisPage />} />
            <Route path="/jobs" element={<JobAnalysisPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}