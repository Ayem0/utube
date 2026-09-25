//  @ts-check

import { config } from "@repo/eslint-config/react-internal";
import { tanstackConfig } from '@tanstack/eslint-config';

export default [...tanstackConfig, ...config ];
