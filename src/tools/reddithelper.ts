/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Tool, ToolFactory } from './tool';
import { runAndWait } from './utils';

export const redditNav: ToolFactory = (snapshot: boolean): Tool => {
  return {
    schema: {
      name: 'mcp_reddit_nav',
      description: 'Navigate to Reddit website and perform basic operations',
      inputSchema: {
        type: 'object',
        properties: {
          random_string: {
            type: 'string',
            description: 'Dummy parameter for no-parameter tools'
          }
        },
        required: ['random_string']
      }
    },
    handle: async (context) => {
      const page = await context.createPage();
      await page.goto('https://www.reddit.com', { waitUntil: 'domcontentloaded' });
      // Cap load event to 5 seconds, the page is operational at this point.
      await page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
      return {
        content: [{
          type: 'text',
          text: 'Successfully navigated to Reddit',
        }],
      };
    },
  }
}; 