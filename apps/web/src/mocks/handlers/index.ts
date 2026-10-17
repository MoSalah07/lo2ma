import { adminHandlers } from './admin';
import { authHandlers } from './auth';
import { chatHandlers } from './chat';
import { orderHandlers } from './orders';
import { placeHandlers } from './places';
import { planHandlers } from './plan';
import { prefsHandlers } from './prefs';
import { suggestionHandlers } from './suggestions';

/** Every mocked endpoint. In phase 2 FastAPI implements the same contract and these go away. */
export const handlers = [
  ...prefsHandlers,
  ...placeHandlers,
  ...chatHandlers,
  ...suggestionHandlers,
  ...orderHandlers,
  ...planHandlers,
  ...authHandlers,
  ...adminHandlers,
];
