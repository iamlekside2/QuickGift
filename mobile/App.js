import "./global.css";
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { CartProvider } from './src/context/CartContext';
import RootNavigator from './src/navigation/RootNavigator';

// Keep native splash visible until app is ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
      <CartProvider>
        <NavigationContainer onReady={() => SplashScreen.hideAsync()}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
