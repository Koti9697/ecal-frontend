// In src/App.tsx

import { useAppSelector } from './store/hooks';
import { LoginScreen } from './screens/LoginScreen';
import { MainApp } from './screens/MainApp';
// --- THIS IS THE FIX (Part 1) ---
// Import the Toaster component here.
import { Toaster } from 'react-hot-toast';

export function App() {
    const { token } = useAppSelector((state) => state.auth);

    return (
        <>
            {/* --- THIS IS THE FIX (Part 2) --- */}
            {/* By placing the Toaster here, it is available for all screens, including Login. */}
            <Toaster position="top-right" reverseOrder={false} />
            {token ? <MainApp /> : <LoginScreen />}
        </>
    );
}