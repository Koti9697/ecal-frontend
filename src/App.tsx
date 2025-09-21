// In src/App.tsx

import { useAppSelector } from './store/hooks';
import { LoginScreen } from './screens/LoginScreen';
import { MainApp } from './screens/MainApp';
import { Toaster } from 'react-hot-toast';

export function App() {
    const { token } = useAppSelector((state) => state.auth);

    return (
        <>
            <Toaster position="top-right" reverseOrder={false} />
            {token ? <MainApp /> : <LoginScreen />}
        </>
    );
}