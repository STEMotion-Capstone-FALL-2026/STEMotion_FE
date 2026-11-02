import { expect, test } from '@playwright/test';
import { ADMIN, API_URL, login, runId, setupWorkspace, formulaScenes } from './support/api';

const headers = (token:string) => ({Authorization:`Bearer ${token}`});

test('system USER has independent production roles in different workspaces',async({request})=>{
  const run=runId();
  const team=await setupWorkspace(request,run);
  const me=await(await request.get(`${API_URL}/auth/me`,{headers:headers(team.tokens.WRITER)})).json();
  expect(me.user.systemRole).toBe('USER');expect(me.user.role).toBeUndefined();
  expect((await request.get(`${API_URL}/users`,{headers:headers(team.tokens.WRITER)})).status()).toBe(403);
  const second=await request.post(`${API_URL}/workspaces`,{headers:headers(team.adminToken),data:{
    name:`Role separation ${run}`,leaderUserId:team.writer.id,leaderRole:'REVIEWER',
    members:[{userId:team.reviewer.id,role:'WRITER'},{userId:team.producer.id,role:'PRODUCER'}],
  }});
  expect(second.status()).toBe(201);
  const secondId=(await second.json()).id;
  const mine=await(await request.get(`${API_URL}/workspaces/mine`,{headers:headers(team.tokens.WRITER)})).json();
  expect(mine.find((w:any)=>w.id===team.workspaceId).myRole).toBe('WRITER');
  expect(mine.find((w:any)=>w.id===secondId).myRole).toBe('REVIEWER');
  const data={title:'Scope boundary',subject:'Physics',gradeLevel:'10',scenes:formulaScenes()};
  expect((await request.post(`${API_URL}/workspaces/${team.workspaceId}/scripts`,{headers:headers(team.tokens.WRITER),data})).status()).toBe(201);
  expect((await request.post(`${API_URL}/workspaces/${secondId}/scripts`,{headers:headers(team.tokens.WRITER),data})).status()).toBe(403);
  for(const role of ['ADMIN','USER'])expect((await request.post(`${API_URL}/workspaces/${secondId}/members`,{
    headers:headers(team.adminToken),data:{userId:team.writer.id,role},
  })).status()).toBe(400);
});

test('Google-only USER can become ADMIN without changing identity and old sessions are revoked',async({request})=>{
  const run=runId(),email=`roles-${run}@gmail.com`,subject=`roles-${run}`;
  const admin=await login(request,ADMIN.username,ADMIN.password);
  expect((await request.post(`${API_URL}/admin/google-whitelist`,{headers:headers(admin),data:{email}})).status()).toBe(201);
  const googleLogin=async()=>{
    const c=await(await request.post(`${API_URL}/auth/google/challenge`)).json();
    const response=await request.post(`${API_URL}/auth/google`,{data:{credential:`e2e:${subject}:${email}:${c.nonce}`,challengeId:c.challengeId,challengeSecret:c.challengeSecret}});
    expect(response.status()).toBe(200);return response.json();
  };
  const first=await googleLogin();expect(first.user.systemRole).toBe('USER');
  const mine=await request.get(`${API_URL}/workspaces/mine`,{headers:headers(first.accessToken)});
  expect(await mine.json()).toEqual([]);
  expect((await request.get(`${API_URL}/admin/google-whitelist`,{headers:headers(first.accessToken)})).status()).toBe(403);
  const changed=await request.patch(`${API_URL}/users/${first.user.id}`,{headers:{...headers(admin),'If-Match':String(first.user.version)},data:{systemRole:'ADMIN'}});
  expect(changed.status()).toBe(200);
  expect((await request.get(`${API_URL}/auth/me`,{headers:headers(first.accessToken)})).status()).toBe(401);
  const second=await googleLogin();expect(second.user.id).toBe(first.user.id);expect(second.user.systemRole).toBe('ADMIN');
  expect(second.session.requiresPasswordChange).toBe(false);
  expect((await request.get(`${API_URL}/admin/google-whitelist`,{headers:headers(second.accessToken)})).status()).toBe(200);
  const stale=await request.patch(`${API_URL}/users/${second.user.id}`,{headers:{...headers(admin),'If-Match':String(first.user.version)},data:{systemRole:'USER'}});
  expect(stale.status()).toBe(409);
  expect((await request.patch(`${API_URL}/users/${second.user.id}`,{headers:{...headers(admin),'If-Match':String(second.user.version)},data:{systemRole:'USER'}})).status()).toBe(200);
});

test('whitelist notification reaches local preview without claiming real delivery',async({request})=>{
  const admin=await login(request,ADMIN.username,ADMIN.password),email=`mail-${runId()}@gmail.com`;
  const result=await request.post(`${API_URL}/admin/google-whitelist`,{headers:headers(admin),data:{email}});
  expect(result.status()).toBe(201);const row=await result.json();
  expect(row.notification.status).toBe('PENDING');
  await expect.poll(async()=>{
    const response=await request.get(`${API_URL}/admin/google-whitelist?query=${encodeURIComponent(email)}`,{headers:headers(admin)});
    expect(response.status()).toBe(200);const rows=await response.json();return rows[0].notification.status;
  },{timeout:25000,intervals:[1000,2000]}).toBe('PREVIEW');
  expect((await request.patch(`${API_URL}/admin/google-whitelist/${row.id}`,{headers:headers(admin),data:{status:'REVOKED',version:row.version}})).status()).toBe(200);
});
