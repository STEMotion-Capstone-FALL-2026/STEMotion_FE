import {test,expect} from '@playwright/test';
import {API_URL,ADMIN,INITIAL_PASSWORD,CHANGED_PASSWORD,login,provision,runId,changePassword} from './support/api';

// Business-flow tokens are accepted ONLY by the test-classpath E2eGoogleVerifier.
test('whitelist, explicit linking, Google password policy and revocation',async({request})=>{
  const run=runId();let admin=await login(request,ADMIN.username,ADMIN.password);
  const gmail=`auth-${run}@gmail.com`;const auth=(t:string)=>({Authorization:`Bearer ${t}`});
  const add=await request.post(`${API_URL}/admin/google-whitelist`,{headers:auth(admin),data:{email:gmail}});
  expect(add.status()).toBe(201);let row=await add.json();
  const account=await provision(request,admin,`Local ${run}`,`auth-${run}`,'WRITER');
  const first=await login(request,account.username,INITIAL_PASSWORD);
  await changePassword(request,first,INITIAL_PASSWORD,CHANGED_PASSWORD);
  const local=await login(request,account.username,CHANGED_PASSWORD);
  const challenge=await(await request.post(`${API_URL}/profile/google/link-challenge`,{headers:auth(local),data:{currentPassword:CHANGED_PASSWORD}})).json();
  const linked=await request.post(`${API_URL}/profile/google/link`,{headers:auth(local),data:{credential:`e2e:sub-${run}:${gmail}:${challenge.nonce}`,challengeId:challenge.challengeId,challengeSecret:challenge.challengeSecret}});
  expect(linked.status()).toBe(200);const linkedAuth=await linked.json();expect(linkedAuth.user.id).toBe(account.id);
  const googleChallenge=await(await request.post(`${API_URL}/auth/google/challenge`)).json();
  const googleLogin=await request.post(`${API_URL}/auth/google`,{data:{credential:`e2e:sub-${run}:${gmail}:${googleChallenge.nonce}`,challengeId:googleChallenge.challengeId,challengeSecret:googleChallenge.challengeSecret}});
  expect(googleLogin.status()).toBe(200);const google=await googleLogin.json();
  expect(google.user.id).toBe(account.id);expect(google.session.requiresPasswordChange).toBe(false);
  const revoked=await request.patch(`${API_URL}/admin/google-whitelist/${row.id}`,{headers:auth(admin),data:{status:'REVOKED',version:row.version}});
  expect(revoked.status()).toBe(200);
  expect((await request.get(`${API_URL}/auth/me`,{headers:auth(google.accessToken)})).status()).toBe(401);
  expect((await request.get(`${API_URL}/auth/me`,{headers:auth(linkedAuth.accessToken)})).status()).toBe(200);
});

test('Google-only login uses the actual FE callback and profile without a password prompt',async({page,request})=>{
  const run=runId(), gmail=`ui-${run}@gmail.com`;
  const admin=await login(request,ADMIN.username,ADMIN.password);
  const added=await request.post(`${API_URL}/admin/google-whitelist`,{headers:{Authorization:`Bearer ${admin}`},data:{email:gmail}});
  expect(added.status()).toBe(201);
  // Only the third-party GIS surface is stubbed. No fake-token code is added to the FE bundle.
  await page.addInitScript(({gmail,subject})=>{
    let configuration:{nonce:string;callback:(r:{credential:string})=>void};
    (window as any).google={accounts:{id:{
      initialize(options:typeof configuration){configuration=options;},
      renderButton(element:HTMLElement){const button=document.createElement('button');button.type='button';button.textContent='Google test identity';
        button.onclick=()=>configuration.callback({credential:`e2e:${subject}:${gmail}:${configuration.nonce}`});element.appendChild(button);},
      disableAutoSelect(){}
    }}};
  },{gmail,subject:`ui-sub-${run}`});
  await page.goto('/');
  await page.getByRole('button',{name:'Google test identity'}).click();
  await expect(page.getByRole('heading',{name:'Đổi Mật Khẩu Lần Đầu'})).toHaveCount(0);
  await page.getByRole('button',{name:'Cài đặt hồ sơ'}).click();
  await expect(page.getByRole('dialog',{name:'Cài đặt hồ sơ'})).toContainText(gmail);
  await expect(page.getByLabel('Mật khẩu hiện tại',{exact:true})).toHaveCount(0);
  await page.getByLabel('Tên hiển thị').fill(`Google ${run}`);
  await page.getByRole('button',{name:'Lưu tên'}).click();
  await expect(page.getByRole('status')).toContainText('Đã cập nhật tên.');
});

test('Google outside whitelist creates no login session',async({request})=>{
  const c=await(await request.post(`${API_URL}/auth/google/challenge`)).json();
  const r=await request.post(`${API_URL}/auth/google`,{data:{credential:`e2e:unknown-${runId()}:unknown-${runId()}@gmail.com:${c.nonce}`,challengeId:c.challengeId,challengeSecret:c.challengeSecret}});
  expect(r.status()).toBe(403);expect((await r.json()).code).toBe('ACCOUNT_NOT_IN_SYSTEM');
});

test('concurrent first Google logins retain one owner and a consumed challenge cannot be replayed',async({request})=>{
  const run=runId(),email=`race-${run}@gmail.com`,subject=`race-sub-${run}`;
  const admin=await login(request,ADMIN.username,ADMIN.password);
  expect((await request.post(`${API_URL}/admin/google-whitelist`,{headers:{Authorization:`Bearer ${admin}`},data:{email}})).status()).toBe(201);
  const challenges=await Promise.all([0,1].map(async()=>{
    const r=await request.post(`${API_URL}/auth/google/challenge`);expect(r.status()).toBe(200);return r.json();
  }));
  const bodies=challenges.map(c=>({credential:`e2e:${subject}:${email}:${c.nonce}`,challengeId:c.challengeId,challengeSecret:c.challengeSecret}));
  const replies=await Promise.all(bodies.map(data=>request.post(`${API_URL}/auth/google`,{data})));
  for(const reply of replies)expect(reply.status()).toBe(200);
  const users=await Promise.all(replies.map(r=>r.json()));expect(users[0].user.id).toBe(users[1].user.id);
  const replay=await request.post(`${API_URL}/auth/google`,{data:bodies[0]});
  expect(replay.status()).toBe(409);expect((await replay.json()).code).toBe('GOOGLE_CHALLENGE_INVALID');
});

test('normal users cannot manage whitelist or merge a Gmail already owned by another user',async({request})=>{
  const run=runId(),email=`owner-${run}@gmail.com`,subject=`owner-sub-${run}`;
  const admin=await login(request,ADMIN.username,ADMIN.password),bearer=(token:string)=>({Authorization:`Bearer ${token}`});
  await request.post(`${API_URL}/admin/google-whitelist`,{headers:bearer(admin),data:{email}});
  const c=await(await request.post(`${API_URL}/auth/google/challenge`)).json();
  const google=await(await request.post(`${API_URL}/auth/google`,{data:{credential:`e2e:${subject}:${email}:${c.nonce}`,challengeId:c.challengeId,challengeSecret:c.challengeSecret}})).json();
  const local=await provision(request,admin,`Local Owner ${run}`,`owner-${run}`,'WRITER');
  const temporary=await login(request,local.username,INITIAL_PASSWORD);
  await changePassword(request,temporary,INITIAL_PASSWORD,CHANGED_PASSWORD);
  const token=await login(request,local.username,CHANGED_PASSWORD);
  expect((await request.get(`${API_URL}/admin/google-whitelist`,{headers:bearer(token)})).status()).toBe(403);
  const linkChallenge=await(await request.post(`${API_URL}/profile/google/link-challenge`,{headers:bearer(token),data:{currentPassword:CHANGED_PASSWORD}})).json();
  const conflict=await request.post(`${API_URL}/profile/google/link`,{headers:bearer(token),data:{credential:`e2e:${subject}:${email}:${linkChallenge.nonce}`,challengeId:linkChallenge.challengeId,challengeSecret:linkChallenge.challengeSecret}});
  expect(conflict.status()).toBe(409);expect((await conflict.json()).code).toBe('GOOGLE_IDENTITY_IN_USE');
  const me=await(await request.get(`${API_URL}/auth/me`,{headers:bearer(token)})).json();
  expect(me.user.id).toBe(local.id);expect(me.user.googleLinked).toBe(false);expect(google.user.id).not.toBe(local.id);
});
