import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {authService} from './authService';
import {apiClient} from './apiClient';
const payload={accessToken:'new-token',user:{id:'u1',fullName:'Writer',username:'writer',systemRole:'USER',hasLocalPassword:true},session:{authMethod:'PASSWORD',requiresPasswordChange:true}};
const respond=(status:number,body:unknown)=>vi.fn().mockResolvedValue({ok:status<300,status,statusText:String(status),text:async()=>JSON.stringify(body)} as Response);
describe('auth v2 session contract',()=>{
  beforeEach(()=>{localStorage.clear();});afterEach(()=>vi.unstubAllGlobals());
  it('sends canonical username without carrying an old JWT',async()=>{
    apiClient.setAuthToken('old-token');const fetch=respond(200,payload);vi.stubGlobal('fetch',fetch);
    const u=await authService.login(' Writer ','password');
    const options=fetch.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(options.body as string)).toEqual({username:'writer',password:'password'});
    expect(options.headers).not.toHaveProperty('Authorization');expect(u.requiresPasswordChange).toBe(true);
  });
  it('rejects an incomplete response instead of using the previous cached identity',async()=>{
    vi.stubGlobal('fetch',respond(200,{user:payload.user}));
    await expect(authService.login('writer','password')).rejects.toMatchObject({code:'INVALID_AUTH_RESPONSE'});
    expect(apiClient.getAuthToken()).toBeNull();
  });
  it('uses the server session flag rather than the local credential flag on Google login',async()=>{
    vi.stubGlobal('fetch',respond(200,{...payload,user:{...payload.user,mustChangePassword:true},session:{authMethod:'GOOGLE',requiresPasswordChange:false}}));
    const u=await authService.loginWithGoogle({credential:'token',challengeId:'id',challengeSecret:'secret'});
    expect(u.requiresPasswordChange).toBe(false);expect(u.authMethod).toBe('GOOGLE');
  });
  it('replaces the JWT before the app can bootstrap after changing a password',async()=>{
    apiClient.setAuthToken('old-token');vi.stubGlobal('fetch',respond(200,{...payload,session:{authMethod:'PASSWORD',requiresPasswordChange:false}}));
    await authService.changePassword('old-password','new-password');
    expect(apiClient.getAuthToken()).toBe('new-token');expect(authService.getCurrentUser().requiresPasswordChange).toBe(false);
  });
  it('does not clear an existing session after a public login is refused',async()=>{
    apiClient.setAuthToken('existing');vi.stubGlobal('fetch',respond(401,{code:'INVALID_CREDENTIALS',message:'Invalid credentials'}));
    await expect(authService.login('writer','wrong')).rejects.toMatchObject({code:'INVALID_CREDENTIALS'});
    expect(apiClient.getAuthToken()).toBe('existing');
  });
  it('discards a Google response arriving after logout',async()=>{
    let finish!:(value:unknown)=>void;
    vi.stubGlobal('fetch',vi.fn(()=>new Promise(resolve=>{finish=resolve;})));
    const pending=authService.loginWithGoogle({credential:'token',challengeId:'id',challengeSecret:'secret'});
    authService.logout();finish({ok:true,status:200,text:async()=>JSON.stringify(payload)});
    await expect(pending).rejects.toThrow();expect(apiClient.getAuthToken()).toBeNull();
  });
});
