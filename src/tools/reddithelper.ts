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

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Tool, ToolFactory } from './tool';
import { runAndWait } from './utils';

export const redditNav: ToolFactory = (snapshot: boolean): Tool => {
  return {
    schema: {
      name: 'mcp_reddit_nav',
      description: 'Navigate to Reddit website and perform basic operations',
      inputSchema: zodToJsonSchema(z.object({
        random_string: z.string().describe('Dummy parameter for no-parameter tools')
      }))
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

const searchSchema = z.object({
  keywords: z.string().describe('Keywords to search for'),
  pageCount: z.number().min(1).max(10).describe('Number of pages to fetch (each page contains about 25 posts)')
});

export const redditSearch: ToolFactory = (snapshot: boolean): Tool => {
  return {
    schema: {
      name: 'mcp_reddit_search',
      description: 'Search Reddit posts with keywords and return post list',
      inputSchema: zodToJsonSchema(searchSchema)
    },
    handle: async (context, params) => {
      const validatedParams = searchSchema.parse(params);
      const { keywords, pageCount } = validatedParams;
      const page = await context.createPage();
      
      // Navigate to Reddit search page with keywords
      await page.goto(`https://www.reddit.com/search/?q=${encodeURIComponent(keywords)}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
      
      const posts = [];
      let currentPage = 1;
      
      while (currentPage <= pageCount) {
        // Wait for posts to load
        //await page.waitForSelector('[data-testid="post-container"]', { timeout: 10000 });
        // Wait for posts to load
        // await page.waitForSelector('[data-testid="post-title"]', { timeout: 10000 });
        
        // Extract post information
        const newPosts = await page.evaluate(() => {
          const postElements = document.querySelectorAll('[data-testid="post-title"]');
          return Array.from(postElements).map(post => {
            const title = post.textContent || '';
            return {
              title,
              content: '(No text content available)'
            };
          });
        });
        
        posts.push(...newPosts);
        
        
        
        // If we need more pages and there's a next button, click it
        if (currentPage < pageCount) {
          const nextButton = await page.$('button[aria-label="Next"]');
          if (!nextButton) break;
          
          await nextButton.click();
          await page.waitForTimeout(2000); // Wait for new content to load
        }
        
        currentPage++;
      }
      
      await page.close();
      
      return {
        content: [{
          type: 'text',
          text: `Found ${posts.length} posts:\n\n` + posts.map((post, index) => 
            `${index + 1}. Title: ${post.title}\nContent: ${post.content}\n`
          ).join('\n')
        }],
      };
    },
  }
}; 