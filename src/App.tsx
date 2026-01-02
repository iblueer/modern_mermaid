import Layout from './components/Layout';
import { LanguageProvider } from './contexts/LanguageContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { FileProvider } from './contexts/FileContext';
import GoogleAnalytics from './components/GoogleAnalytics';
import UserNotice from './components/UserNotice';

function App() {
  return (
    <DarkModeProvider>
      <LanguageProvider>
        <FileProvider>
          <GoogleAnalytics />
          <UserNotice />
          <Layout />
        </FileProvider>
      </LanguageProvider>
    </DarkModeProvider>
  );
}

export default App;
