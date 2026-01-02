import Layout from './components/Layout';
import { LanguageProvider } from './contexts/LanguageContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { FileProvider } from './contexts/FileContext';
import GoogleAnalytics from './components/GoogleAnalytics';
import UserNotice from './components/UserNotice';
import { LLMProvider } from './contexts/LLMContext';

function App() {
  return (
    <DarkModeProvider>
      <LanguageProvider>
        <FileProvider>
          <LLMProvider>
            <GoogleAnalytics />
            <UserNotice />
            <Layout />
          </LLMProvider>
        </FileProvider>
      </LanguageProvider>
    </DarkModeProvider>
  );
}

export default App;
