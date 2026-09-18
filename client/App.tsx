import { lazy, Suspense } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import RouteLoading from '#components/RouteLoading';
import Alert from '#components/commons/Alert';
import { Toaster } from 'react-hot-toast';
import RouteLogin from './routes/RouteLogin';
import RouteRegister from './routes/RouteRegister';
import RouteNotFound from './routes/RouteNotFound';

const RouteHome = lazy(() => import('./routes/RouteHome'));
const RouteWhitelabel = lazy(() => import('./routes/RouteWhitelabel'));
const RouteUsers = lazy(() => import('./routes/RouteUsers'));
const RouteRoles = lazy(() => import('./routes/RouteRoles'));

function App() {
  const [location] = useLocation();

  return (
    <>
      <Toaster position="top-center" reverseOrder>
        {(toast) => <Alert toast={toast} />}
      </Toaster>
      <Suspense key={location} fallback={<RouteLoading />}>
        <Switch>
          <Route path="/" component={RouteHome} />
          <Route path="/whitelabel" component={RouteWhitelabel} />
          <Route path="/users" component={RouteUsers} />
          <Route path="/roles" component={RouteRoles} />
          <Route path="/login" component={RouteLogin} />
          <Route path="/register" component={RouteRegister} />
          <Route component={RouteNotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

export default App;
