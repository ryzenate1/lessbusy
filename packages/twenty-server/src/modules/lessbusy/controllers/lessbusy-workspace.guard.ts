import { ConflictException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class LessBusyWorkspaceGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ workspace?: { id: string }; headers: Record<string, string | string[] | undefined>; method: string }>();
    const expected = request.headers['x-lessbusy-workspace-id'];
    if (expected === undefined && ['GET', 'HEAD'].includes(request.method)) return true;
    const workspaceId = z.string().uuid().safeParse(expected);
    if (!workspaceId.success || workspaceId.data !== request.workspace?.id) throw new ConflictException('Workspace changed. Reopen this page in the intended workspace before continuing.');
    return true;
  }
}
