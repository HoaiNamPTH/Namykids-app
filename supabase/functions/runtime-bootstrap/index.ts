import {
  authenticateRuntimeRequest,
  databaseErrorResponse,
  isRuntimeContext,
  type RuntimeContext,
} from "../_shared/runtime-auth.ts";
import { bootstrapChildColumns, handleRuntimeBootstrap } from "./logic.ts";

export default {
  fetch(request: Request): Promise<Response> {
    return handleRuntimeBootstrap<RuntimeContext>(request, {
      async authenticate(runtimeRequest) {
        const result = await authenticateRuntimeRequest(runtimeRequest);
        return isRuntimeContext(result) ? { context: result.context } : { response: result.response };
      },
      parentUserId(context) {
        return context.parentUserId;
      },
      async loadChildren(context) {
        const { data, error } = await context.webData.from("child_profiles").select(bootstrapChildColumns);
        return { data: data as { id: string; parent_user_id: string }[] | null, error };
      },
      async upsertBinding(context, parentUserId, childId) {
        return context.appAdmin.rpc("upsert_app_identity_binding", {
          p_parent_user_id: parentUserId,
          p_child_id: childId,
        });
      },
      databaseError: databaseErrorResponse,
    });
  },
};
