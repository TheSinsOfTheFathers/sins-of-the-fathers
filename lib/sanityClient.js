import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: '8cfeoaz2', 
  dataset: 'production',
  useCdn: true, 
  apiVersion: '2025-11-09',
})