/**
 * Copyright 2025 Bréval LE FLOCH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import PocketBase from "pocketbase";
import type { Where } from "better-auth";
import { createAdapterFactory } from "better-auth/adapters";

export interface PocketBaseAdapterConfig {
  /**
   * PocketBase instance or configuration
   * You can provide:
   *   - a PocketBase instance
   *   - or an object with { url, adminEmail, adminPassword, token }
   * If both token and adminEmail/adminPassword are provided, token is preferred.
   */
  pb: PocketBase | { url: string; adminEmail?: string; adminPassword?: string; token?: string };

  /**
   * Enable debug logs for the adapter
   * @default false
   */
  debugLogs?: boolean;

  /**
   * Whether to use plural names for the auth tables
   * Set to `false` to use singular names: user, session, account, verification
   * Set to `true` to use plural names: users, sessions, accounts, verifications
   * 
   * The provided schema in `schema/pocketbase.collections.json` uses singular names,
   * so set this to `false` if using that schema.
   * 
   * @default true
   */
  usePlural?: boolean;
}

/**
 * Parse Better Auth where clauses to PocketBase filter strings
 */
export function parseWhere(where?: Where[]): string {
  if (!where || where.length === 0) return "";
  
  const filters: string[] = [];
  
  for (const item of where) {
    const field = item.field;
    const value = typeof item.value === "string" ? `"${item.value}"` : item.value;
    
    switch (item.operator) {
      case "eq":
        filters.push(`${field} = ${value}`);
        break;
      case "ne":
        filters.push(`${field} != ${value}`);
        break;
      case "in":
        if (Array.isArray(item.value)) {
          const values = item.value.map(v => typeof v === "string" ? `"${v}"` : v).join(", ");
          filters.push(`${field} ?~ [${values}]`);
        }
        break;
      case "contains":
        filters.push(`${field} ~ "${item.value}"`);
        break;
      case "starts_with":
        filters.push(`${field} ~ "${item.value}%"`);
        break;
      case "ends_with":
        filters.push(`${field} ~ "%${item.value}"`);
        break;
      case "gt":
        filters.push(`${field} > ${value}`);
        break;
      case "gte":
        filters.push(`${field} >= ${value}`);
        break;
      case "lt":
        filters.push(`${field} < ${value}`);
        break;
      case "lte":
        filters.push(`${field} <= ${value}`);
        break;
    }
  }
  
  return filters.join(" && ");
}

/**
 * Create a Better Auth adapter for PocketBase
 */
export const pocketBaseAdapter = ({
  pb: pbConfig,
  debugLogs = false,
  usePlural = true,
}: PocketBaseAdapterConfig) => {
  const pb = pbConfig instanceof PocketBase 
    ? pbConfig 
    : new PocketBase(pbConfig.url);
  

  // Auto-authenticate if credentials or token provided
  const ensureAuth = async () => {
    if (pbConfig instanceof PocketBase) return;
    // Prefer JWT token if provided
    if (pbConfig.token) {
      if (pb.authStore.token !== pbConfig.token) {
        pb.authStore.save(pbConfig.token, null);
      }
      return;
    }
    // Fallback to adminEmail/adminPassword
    if (pbConfig.adminEmail && pbConfig.adminPassword) {
      if (!pb.authStore.isValid) {
        await pb.collection("_superusers").authWithPassword(pbConfig.adminEmail, pbConfig.adminPassword);
      }
    }
  };
  
  return createAdapterFactory({
    config: {
      adapterId: "pocketbase",
      adapterName: "PocketBase Adapter",
      usePlural,
      debugLogs,
      supportsDates: true,
      supportsBooleans: true,
      supportsJSON: false,
      supportsNumericIds: false,
      disableIdGeneration: true, // Let PocketBase generate its own IDs (15 chars)
    },
    adapter: ({ options, getFieldName, getDefaultModelName, getModelName, debugLog }) => {
      return {
        async create({ data, model }) {
          await ensureAuth();
          debugLog("create", { model, data });
          
          const collectionName = getModelName(model);
          
          try {
            const record = await pb.collection(collectionName).create(data as Record<string, any>);
            return record as any;
          } catch (error) {
            if (debugLogs) {
              console.error(`[PocketBase] Create error in ${collectionName}:`, error);
            }
            throw error;
          }
        },
        
        async findOne({ model, where }) {
          await ensureAuth();
          debugLog("findOne", { model, where });
          
          const collectionName = getModelName(model);
          const filter = parseWhere(where);
          
          try {
            const result = await pb.collection(collectionName).getList(1, 1, {
              filter,
            });
            
            return result.items[0] as any || null;
          } catch (error) {
            if (debugLogs) {
              console.error(`[PocketBase] FindOne error in ${collectionName}:`, error);
            }
            return null;
          }
        },
        
        async findMany({ model, where, limit, offset, sortBy }) {
          await ensureAuth();
          debugLog("findMany", { model, where, limit, offset, sortBy });
          
          const collectionName = getModelName(model);
          const filter = parseWhere(where);
          
          const page = offset ? Math.floor(offset / (limit || 50)) + 1 : 1;
          const perPage = limit || 50;
          
          const sort = sortBy 
            ? `${sortBy.direction === "desc" ? "-" : ""}${sortBy.field}`
            : undefined;
          
          try {
            const result = await pb.collection(collectionName).getList(page, perPage, {
              filter: filter || undefined,
              sort,
            });
            
            return result.items as any[];
          } catch (error) {
            if (debugLogs) {
              console.error(`[PocketBase] FindMany error in ${collectionName}:`, error);
            }
            return [];
          }
        },
        
        async count({ model, where }) {
          await ensureAuth();
          debugLog("count", { model, where });
          
          const collectionName = getModelName(model);
          const filter = parseWhere(where);
          
          try {
            const result = await pb.collection(collectionName).getList(1, 1, {
              filter: filter || undefined,
            });
            
            return result.totalItems;
          } catch (error) {
            if (debugLogs) {
              console.error(`[PocketBase] Count error in ${collectionName}:`, error);
            }
            return 0;
          }
        },
        
        async update({ model, where, update }) {
          await ensureAuth();
          debugLog("update", { model, where, update });
          
          const collectionName = getModelName(model);
          const filter = parseWhere(where);
          
          try {
            // Find the record first
            const result = await pb.collection(collectionName).getList(1, 1, {
              filter,
            });
            
            if (result.items.length === 0) {
              return null;
            }
            
            const record = result.items[0];
            const updated = await pb.collection(collectionName).update(record.id, update as Record<string, any>);
            
            return { ...updated, ...update } as any;
          } catch (error) {
            if (debugLogs) {
              console.error(`[PocketBase] Update error in ${collectionName}:`, error);
            }
            return null;
          }
        },
        
        async updateMany({ model, where, update }) {
          await ensureAuth();
          debugLog("updateMany", { model, where, update });
          
          const collectionName = getModelName(model);
          const filter = parseWhere(where);
          
          try {
            // PocketBase doesn't have updateMany, so we fetch and update individually
            const result = await pb.collection(collectionName).getList(1, 500, {
              filter: filter || undefined,
            });
            
            let count = 0;
            for (const record of result.items) {
              await pb.collection(collectionName).update(record.id, update as Record<string, any>);
              count++;
            }
            
            return count;
          } catch (error) {
            if (debugLogs) {
              console.error(`[PocketBase] UpdateMany error in ${collectionName}:`, error);
            }
            return 0;
          }
        },
        
        async delete({ model, where }) {
          await ensureAuth();
          debugLog("delete", { model, where });
          
          const collectionName = getModelName(model);
          const filter = parseWhere(where);
          
          try {
            const result = await pb.collection(collectionName).getList(1, 1, {
              filter,
            });
            
            if (result.items.length > 0) {
              await pb.collection(collectionName).delete(result.items[0].id);
            }
          } catch (error) {
            if (debugLogs) {
              console.error(`[PocketBase] Delete error in ${collectionName}:`, error);
            }
          }
        },
        
        async deleteMany({ model, where }) {
          await ensureAuth();
          debugLog("deleteMany", { model, where });
          
          const collectionName = getModelName(model);
          const filter = parseWhere(where);
          
          try {
            // PocketBase doesn't have deleteMany, so we fetch and delete individually
            const result = await pb.collection(collectionName).getList(1, 500, {
              filter: filter || undefined,
            });
            
            let count = 0;
            for (const record of result.items) {
              await pb.collection(collectionName).delete(record.id);
              count++;
            }
            
            return count;
          } catch (error) {
            if (debugLogs) {
              console.error(`[PocketBase] DeleteMany error in ${collectionName}:`, error);
            }
            return 0;
          }
        },
        
        options: { usePlural, debugLogs },
      };
    },
  });
};

