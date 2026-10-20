import { defineConfig } from 'vitest/config';
import { testConfig } from './vitest.config.ts';
export default defineConfig(testConfig(true));
