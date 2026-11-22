import { accessFor, type Access } from "./access";
import { useSession } from "./account";

export function useAccess(): Access {
  const { account } = useSession();
  return account ? accessFor(account.trialStart, Date.now(), account.paid) : accessFor(Date.now(), Date.now());
}
