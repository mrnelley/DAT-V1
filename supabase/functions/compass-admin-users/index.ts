import { createClient } from 'npm:@supabase/supabase-js@2.110.8';
import { createUserHandler } from './handler.js';
Deno.serve(createUserHandler({createClient,env:(key:string)=>Deno.env.get(key)}));
