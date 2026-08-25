import{f as oe,E as ie,_ as y,g as se,a as ae,D as k,L as ce,h as le,j as ue,i as F,k as he,e as H,C as O,r as de}from"./index.js";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const P=new Map,z={activated:!1,tokenObservers:[]},fe={initialized:!1,enabled:!1};function l(e){return P.get(e)||{...z}}function pe(e,t){return P.set(e,t),P.get(e)}function _(){return fe}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const D="https://content-firebaseappcheck.googleapis.com/v1",ge="exchangeRecaptchaV3Token",ke="exchangeRecaptchaEnterpriseToken",Te="exchangeDebugToken",B={RETRIAL_MIN_WAIT:30*1e3,RETRIAL_MAX_WAIT:16*60*1e3},me=24*60*60*1e3;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ee{constructor(t,r,n,o,i){if(this.operation=t,this.retryPolicy=r,this.getWaitDuration=n,this.lowerBound=o,this.upperBound=i,this.pending=null,this.nextErrorWaitInterval=o,o>i)throw new Error("Proactive refresh lower bound greater than upper bound!")}start(){this.nextErrorWaitInterval=this.lowerBound,this.process(!0).catch(()=>{})}stop(){this.pending&&(this.pending.reject("cancelled"),this.pending=null)}isRunning(){return!!this.pending}async process(t){this.stop();try{this.pending=new k,this.pending.promise.catch(r=>{}),await we(this.getNextRun(t)),this.pending.resolve(),await this.pending.promise,this.pending=new k,this.pending.promise.catch(r=>{}),await this.operation(),this.pending.resolve(),await this.pending.promise,this.process(!0).catch(()=>{})}catch(r){this.retryPolicy(r)?this.process(!1).catch(()=>{}):this.stop()}}getNextRun(t){if(t)return this.nextErrorWaitInterval=this.lowerBound,this.getWaitDuration();{const r=this.nextErrorWaitInterval;return this.nextErrorWaitInterval*=2,this.nextErrorWaitInterval>this.upperBound&&(this.nextErrorWaitInterval=this.upperBound),r}}}function we(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ae={"already-initialized":"You have already called initializeAppCheck() for FirebaseApp {$appName} with different options. To avoid this error, call initializeAppCheck() with the same options as when it was originally called. This will return the already initialized instance.","use-before-activation":"App Check is being used before initializeAppCheck() is called for FirebaseApp {$appName}. Call initializeAppCheck() before instantiating other Firebase services.","fetch-network-error":"Fetch failed to connect to a network. Check Internet connection. Original error: {$originalErrorMessage}.","fetch-parse-error":"Fetch client could not parse response. Original error: {$originalErrorMessage}.","fetch-status-error":"Fetch server returned an HTTP error status. HTTP status: {$httpStatus}.","storage-open":"Error thrown when opening storage. Original error: {$originalErrorMessage}.","storage-get":"Error thrown when reading from storage. Original error: {$originalErrorMessage}.","storage-set":"Error thrown when writing to storage. Original error: {$originalErrorMessage}.","recaptcha-error":"ReCAPTCHA error.","initial-throttle":"{$httpStatus} error. Attempts allowed again after {$time}",throttled:"Requests throttled due to previous {$httpStatus} error. Attempts allowed again after {$time}"},h=new ie("appCheck","AppCheck",Ae);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function w(e=!1){var t;return e?(t=self.grecaptcha)==null?void 0:t.enterprise:self.grecaptcha}function S(e){if(!l(e).activated)throw h.create("use-before-activation",{appName:e.name})}function I(e){const t=Math.round(e/1e3),r=Math.floor(t/(3600*24)),n=Math.floor((t-r*3600*24)/3600),o=Math.floor((t-r*3600*24-n*3600)/60),i=t-r*3600*24-n*3600-o*60;let s="";return r&&(s+=m(r)+"d:"),n&&(s+=m(n)+"h:"),s+=m(o)+"m:"+m(i)+"s",s}function m(e){return e===0?"00":e>=10?e.toString():"0"+e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function C({url:e,body:t},r){const n={"Content-Type":"application/json"},o=r.getImmediate({optional:!0});if(o){const d=await o.getHeartbeatsHeader();d&&(n["X-Firebase-Client"]=d)}const i={method:"POST",body:JSON.stringify(t),headers:n};let s;try{s=await fetch(e,i)}catch(d){throw h.create("fetch-network-error",{originalErrorMessage:d==null?void 0:d.message})}if(s.status!==200)throw h.create("fetch-status-error",{httpStatus:s.status});let a;try{a=await s.json()}catch(d){throw h.create("fetch-parse-error",{originalErrorMessage:d==null?void 0:d.message})}const u=a.ttl.match(/^([\d.]+)(s)$/);if(!u||!u[2]||isNaN(Number(u[1])))throw h.create("fetch-parse-error",{originalErrorMessage:`ttl field (timeToLive) is not in standard Protobuf Duration format: ${a.ttl}`});const c=Number(u[1])*1e3,p=Date.now();return{token:a.token,expireTimeMillis:p+c,issuedAtTimeMillis:p}}function be(e,t){const{projectId:r,appId:n,apiKey:o}=e.options;return{url:`${D}/projects/${r}/apps/${n}:${ge}?key=${o}`,body:{recaptcha_v3_token:t}}}function _e(e,t){const{projectId:r,appId:n,apiKey:o}=e.options;return{url:`${D}/projects/${r}/apps/${n}:${ke}?key=${o}`,body:{recaptcha_enterprise_token:t}}}function q(e,t){const{projectId:r,appId:n,apiKey:o}=e.options;return{url:`${D}/projects/${r}/apps/${n}:${Te}?key=${o}`,body:{debug_token:t}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ce="firebase-app-check-database",Re=1,T="firebase-app-check-store",U="debug-token";let E=null;function W(){return E||(E=new Promise((e,t)=>{try{const r=indexedDB.open(Ce,Re);r.onsuccess=n=>{e(n.target.result)},r.onerror=n=>{var o;t(h.create("storage-open",{originalErrorMessage:(o=n.target.error)==null?void 0:o.message}))},r.onupgradeneeded=n=>{const o=n.target.result;switch(n.oldVersion){case 0:o.createObjectStore(T,{keyPath:"compositeKey"})}}}catch(r){t(h.create("storage-open",{originalErrorMessage:r==null?void 0:r.message}))}}),E)}function ve(e){return G(X(e))}function Pe(e,t){return j(X(e),t)}function ye(e){return j(U,e)}function De(){return G(U)}async function j(e,t){const n=(await W()).transaction(T,"readwrite"),i=n.objectStore(T).put({compositeKey:e,value:t});return new Promise((s,a)=>{i.onsuccess=u=>{s()},n.onerror=u=>{var c;a(h.create("storage-set",{originalErrorMessage:(c=u.target.error)==null?void 0:c.message}))}})}async function G(e){const r=(await W()).transaction(T,"readonly"),o=r.objectStore(T).get(e);return new Promise((i,s)=>{o.onsuccess=a=>{const u=a.target.result;i(u?u.value:void 0)},r.onerror=a=>{var u;s(h.create("storage-get",{originalErrorMessage:(u=a.target.error)==null?void 0:u.message}))}})}function X(e){return`${e.options.appId}-${e.name}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const f=new ce("@firebase/app-check");/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Se(e){if(F()){let t;try{t=await ve(e)}catch(r){f.warn(`Failed to read token from IndexedDB. Error: ${r}`)}return t}}function R(e,t){return F()?Pe(e,t).catch(r=>{f.warn(`Failed to write token to IndexedDB. Error: ${r}`)}):Promise.resolve()}async function Ie(){let e;try{e=await De()}catch{}if(e)return e;{const t=crypto.randomUUID();return ye(t).catch(r=>f.warn(`Failed to persist debug token to IndexedDB. Error: ${r}`)),t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function M(){return _().enabled}async function x(){const e=_();if(e.enabled&&e.token)return e.token.promise;throw Error(`
            Can't get debug token in production mode.
        `)}function Me(){const e=le(),t=_();if(t.initialized=!0,typeof e.FIREBASE_APPCHECK_DEBUG_TOKEN!="string"&&e.FIREBASE_APPCHECK_DEBUG_TOKEN!==!0)return;t.enabled=!0;const r=new k;t.token=r,typeof e.FIREBASE_APPCHECK_DEBUG_TOKEN=="string"?r.resolve(e.FIREBASE_APPCHECK_DEBUG_TOKEN):r.resolve(Ie())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xe={error:"UNKNOWN_ERROR"};function Ne(e){return he.encodeString(JSON.stringify(e),!1)}async function A(e,t=!1,r=!1){const n=e.app;S(n);const o=l(n);let i=o.token,s;if(i&&!g(i)&&(o.token=void 0,i=void 0),!i){const c=await o.cachedTokenPromise;c&&(g(c)?i=c:await R(n,void 0))}if(!t&&i&&g(i))return{token:i.token};let a=!1;if(M())try{const c=await x();o.exchangeTokenPromise||(o.exchangeTokenPromise=C(q(n,c),e.heartbeatServiceProvider).finally(()=>{o.exchangeTokenPromise=void 0}),a=!0);const p=await o.exchangeTokenPromise;return await R(n,p),o.token=p,{token:p.token}}catch(c){return c.code==="appCheck/throttled"||c.code==="appCheck/initial-throttle"?f.warn(c.message):r&&f.error(c),v(c)}try{o.exchangeTokenPromise||(o.exchangeTokenPromise=o.provider.getToken().finally(()=>{o.exchangeTokenPromise=void 0}),a=!0),i=await l(n).exchangeTokenPromise}catch(c){c.code==="appCheck/throttled"||c.code==="appCheck/initial-throttle"?f.warn(c.message):r&&f.error(c),s=c}let u;return i?s?g(i)?u={token:i.token,internalError:s}:u=v(s):(u={token:i.token},o.token=i,await R(n,i)):u=v(s),a&&Y(n,u),u}async function V(e){const t=e.app;S(t);const{provider:r}=l(t);if(M()){const n=await x(),o=q(t,n);o.body.limited_use=!0;const{token:i}=await C(o,e.heartbeatServiceProvider);return{token:i}}else{const{token:n}=await r.getToken(!0);return{token:n}}}function N(e,t,r,n){const{app:o}=e,i=l(o),s={next:r,error:n,type:t};if(i.tokenObservers=[...i.tokenObservers,s],i.token&&g(i.token)){const a=i.token;Promise.resolve().then(()=>{r({token:a.token}),K(e)}).catch(()=>{})}i.cachedTokenPromise.then(()=>K(e))}function $(e,t){const r=l(e),n=r.tokenObservers.filter(o=>o.next!==t);n.length===0&&r.tokenRefresher&&r.tokenRefresher.isRunning()&&r.tokenRefresher.stop(),r.tokenObservers=n}function K(e){const{app:t}=e,r=l(t);let n=r.tokenRefresher;n||(n=$e(e),r.tokenRefresher=n),!n.isRunning()&&r.isTokenAutoRefreshEnabled&&n.start()}function $e(e){const{app:t}=e;return new Ee(async()=>{const r=l(t);let n;if(r.token?n=await A(e,!0):n=await A(e),n.error)throw n.error;if(n.internalError)throw n.internalError},()=>!0,()=>{const r=l(t);if(r.token){let n=r.token.issuedAtTimeMillis+(r.token.expireTimeMillis-r.token.issuedAtTimeMillis)*.5+3e5;const o=r.token.expireTimeMillis-5*60*1e3;return n=Math.min(n,o),Math.max(0,n-Date.now())}else return 0},B.RETRIAL_MIN_WAIT,B.RETRIAL_MAX_WAIT)}function Y(e,t){const r=l(e).tokenObservers;for(const n of r)try{n.type==="EXTERNAL"&&t.error!=null?n.error(t.error):n.next(t)}catch{}}function g(e){return e.expireTimeMillis-Date.now()>0}function v(e){return{token:Ne(xe),error:e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class He{constructor(t,r){this.app=t,this.heartbeatServiceProvider=r}_delete(){const{tokenObservers:t}=l(this.app);for(const r of t)$(this.app,r.next);return Promise.resolve()}}function Oe(e,t){return new He(e,t)}function Be(e){return{getToken:t=>A(e,t),getLimitedUseToken:()=>V(e),addTokenListener:t=>N(e,"INTERNAL",t),removeTokenListener:t=>$(e.app,t)}}const Ke="@firebase/app-check",Le="0.13.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fe="https://www.google.com/recaptcha/api.js",ze="https://www.google.com/recaptcha/enterprise.js";function qe(e,t){const r=new k,n=l(e);n.reCAPTCHAState={initialized:r};const o=J(e),i=w(!1);return i?b(e,t,i,o,r):je(()=>{const s=w(!1);if(!s)throw new Error("no recaptcha");b(e,t,s,o,r)}),r.promise}function Ue(e,t){const r=new k,n=l(e);n.reCAPTCHAState={initialized:r};const o=J(e),i=w(!0);return i?b(e,t,i,o,r):Ge(()=>{const s=w(!0);if(!s)throw new Error("no recaptcha");b(e,t,s,o,r)}),r.promise}function b(e,t,r,n,o){r.ready(()=>{We(e,t,r,n),o.resolve(r)})}function J(e){const t=`fire_app_check_${e.name}`,r=document.createElement("div");return r.id=t,r.style.display="none",document.body.appendChild(r),t}async function Q(e){S(e);const r=await l(e).reCAPTCHAState.initialized.promise;return new Promise((n,o)=>{const i=l(e).reCAPTCHAState;r.ready(()=>{n(r.execute(i.widgetId,{action:"fire_app_check"}))})})}function We(e,t,r,n){const o=r.render(n,{sitekey:t,size:"invisible",callback:()=>{l(e).reCAPTCHAState.succeeded=!0},"error-callback":()=>{l(e).reCAPTCHAState.succeeded=!1}}),i=l(e);i.reCAPTCHAState={...i.reCAPTCHAState,widgetId:o}}function je(e){const t=document.createElement("script");t.src=Fe,t.onload=e,document.head.appendChild(t)}function Ge(e){const t=document.createElement("script");t.src=ze+"?render=explicit",t.onload=e,document.head.appendChild(t)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Z{constructor(t){this._siteKey=t,this._throttleData=null}async getToken(t=!1){var o,i,s;ne(this._throttleData);const r=await Q(this._app).catch(a=>{throw h.create("recaptcha-error")});if(!((o=l(this._app).reCAPTCHAState)!=null&&o.succeeded))throw h.create("recaptcha-error");let n;try{const a=be(this._app,r);t&&(a.body.limited_use=!0),n=await C(a,this._heartbeatServiceProvider)}catch(a){throw(i=a.code)!=null&&i.includes("fetch-status-error")?(this._throttleData=re(Number((s=a.customData)==null?void 0:s.httpStatus),this._throttleData),h.create("initial-throttle",{time:I(this._throttleData.allowRequestsAfter-Date.now()),httpStatus:this._throttleData.httpStatus})):a}return this._throttleData=null,n}initialize(t){this._app=t,this._heartbeatServiceProvider=y(t,"heartbeat"),qe(t,this._siteKey).catch(()=>{})}isEqual(t){return t instanceof Z?this._siteKey===t._siteKey:!1}}class ee{constructor(t){this._siteKey=t,this._throttleData=null}async getToken(t=!1){var o,i,s;ne(this._throttleData);const r=await Q(this._app).catch(a=>{throw h.create("recaptcha-error")});if(!((o=l(this._app).reCAPTCHAState)!=null&&o.succeeded))throw h.create("recaptcha-error");let n;try{const a=_e(this._app,r);t&&(a.body.limited_use=!0),n=await C(a,this._heartbeatServiceProvider)}catch(a){throw(i=a.code)!=null&&i.includes("fetch-status-error")?(this._throttleData=re(Number((s=a.customData)==null?void 0:s.httpStatus),this._throttleData),h.create("initial-throttle",{time:I(this._throttleData.allowRequestsAfter-Date.now()),httpStatus:this._throttleData.httpStatus})):a}return this._throttleData=null,n}initialize(t){this._app=t,this._heartbeatServiceProvider=y(t,"heartbeat"),Ue(t,this._siteKey).catch(()=>{})}isEqual(t){return t instanceof ee?this._siteKey===t._siteKey:!1}}class te{constructor(t){this._customProviderOptions=t}async getToken(){const t=await this._customProviderOptions.getToken(),r=oe(t.token),n=r!==null&&r<Date.now()&&r>0?r*1e3:Date.now();return{...t,issuedAtTimeMillis:n}}initialize(t){this._app=t}isEqual(t){return t instanceof te?this._customProviderOptions.getToken.toString()===t._customProviderOptions.getToken.toString():!1}}function re(e,t){if(e===404||e===403)return{backoffCount:1,allowRequestsAfter:Date.now()+me,httpStatus:e};{const r=t?t.backoffCount:0,n=ue(r,1e3,2);return{backoffCount:r+1,allowRequestsAfter:Date.now()+n,httpStatus:e}}}function ne(e){if(e&&Date.now()-e.allowRequestsAfter<=0)throw h.create("throttled",{time:I(e.allowRequestsAfter-Date.now()),httpStatus:e.httpStatus})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qe(e=ae(),t){var o;e=se(e);const r=y(e,"app-check");if(_().initialized||Me(),M()&&x().then(i=>console.log(`App Check debug token: ${i}. You will need to add it to your app's App Check settings in the Firebase console for it to work.`)),r.isInitialized()){const i=r.getImmediate(),s=r.getOptions();if(s&&!!s.isTokenAutoRefreshEnabled==!!t.isTokenAutoRefreshEnabled&&((o=s.provider)!=null&&o.isEqual(t.provider)))return i;throw h.create("already-initialized",{appName:e.name})}const n=r.initialize({options:t});return Xe(e,t.provider,t.isTokenAutoRefreshEnabled),l(e).isTokenAutoRefreshEnabled&&N(n,"INTERNAL",()=>{}),n}function Xe(e,t,r=!1){const n=pe(e,{...z});n.activated=!0,n.provider=t,n.cachedTokenPromise=Se(e).then(o=>(o&&g(o)&&(n.token=o,Y(e,{token:o.token})),o)),n.isTokenAutoRefreshEnabled=r&&e.automaticDataCollectionEnabled,!e.automaticDataCollectionEnabled&&r&&f.warn("`isTokenAutoRefreshEnabled` is true but `automaticDataCollectionEnabled` was set to false during `initializeApp()`. This blocks automatic token refresh."),n.provider.initialize(e)}function Ze(e,t){const r=e.app,n=l(r);n.tokenRefresher&&(t===!0?n.tokenRefresher.start():n.tokenRefresher.stop()),n.isTokenAutoRefreshEnabled=t}async function et(e,t){const r=await A(e,t);if(r.error)throw r.error;if(r.internalError)throw r.internalError;return{token:r.token}}function tt(e){return V(e)}function rt(e,t,r,n){let o=()=>{},i=()=>{};return t.next!=null?o=t.next.bind(t):o=t,t.error!=null?i=t.error.bind(t):r&&(i=r),N(e,"EXTERNAL",o,i),()=>$(e.app,o)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ve="app-check",L="app-check-internal";function Ye(){H(new O(Ve,e=>{const t=e.getProvider("app").getImmediate(),r=e.getProvider("heartbeat");return Oe(t,r)},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,r)=>{e.getProvider(L).initialize()})),H(new O(L,e=>{const t=e.getProvider("app-check").getImmediate();return Be(t)},"PUBLIC").setInstantiationMode("EXPLICIT")),de(Ke,Le)}Ye();export{te as CustomProvider,ee as ReCaptchaEnterpriseProvider,Z as ReCaptchaV3Provider,tt as getLimitedUseToken,et as getToken,Qe as initializeAppCheck,rt as onTokenChanged,Ze as setTokenAutoRefreshEnabled};
//# sourceMappingURL=index2.esm.js.map
