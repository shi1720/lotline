import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getAuth, onIdTokenChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, signOut as firebaseSignOut, type Auth, type User } from 'firebase/auth';
export type FirebaseUser = {uid:string;name:string;email:string};
let ready:Promise<Auth>|undefined;
const profile=(u:User|null):FirebaseUser|null=>u?{uid:u.uid,name:u.displayName||u.email?.split('@')[0]||'Your account',email:u.email??''}:null;
function authReady(){
 if(!ready)ready=(async()=>{const response=await fetch('/firebase-config.json',{cache:'no-cache'});if(!response.ok)throw new Error('Sign-in is temporarily unavailable. Your unsaved work is still available to export.');const config=await response.json() as FirebaseOptions;if(!config.projectId||!config.apiKey||!config.authDomain)throw new Error('Sign-in configuration is unavailable. Please try again later.');const app=getApps()[0]??initializeApp(config);const auth=getAuth(app);await auth.authStateReady();return auth;})().catch(error=>{ready=undefined;throw error;});
 return ready;
}
function friendly(error:unknown):Error{
 const code=(error as {code?:string})?.code;
 const messages:Record<string,string>={'auth/invalid-credential':'The email or password does not match. Please try again.','auth/wrong-password':'The email or password does not match. Please try again.','auth/user-not-found':'The email or password does not match. Please try again.','auth/email-already-in-use':'An account already uses this email. Sign in or reset your password.','auth/invalid-email':'Enter a valid email address.','auth/weak-password':'Choose a password with at least 8 characters.','auth/too-many-requests':'Too many attempts. Please wait a moment before trying again.','auth/network-request-failed':'Could not connect. Check your connection and try again.','auth/operation-not-allowed':'This sign-in method is temporarily unavailable.','auth/user-disabled':'This account is unavailable. Contact the project owner for help.'};
 return new Error(code?(messages[code]??'Could not complete sign-in. Please try again.'):error instanceof Error?error.message:'Could not complete sign-in. Please try again.');
}
export function subscribeAuth(callback:(user:FirebaseUser|null)=>void):()=>void{
 let disposed=false,unsubscribe:(()=>void)|undefined;
 authReady().then(auth=>{if(!disposed)unsubscribe=onIdTokenChanged(auth,u=>callback(profile(u)));}).catch(error=>{if(!disposed){callback(null);window.dispatchEvent(new CustomEvent('lotline-auth-error',{detail:friendly(error).message}));}});
 return()=>{disposed=true;unsubscribe?.();};
}
export async function getToken(){const auth=await authReady();return auth.currentUser?auth.currentUser.getIdToken():null;}
export async function signIn(email:string,password:string){try{const auth=await authReady();await signInWithEmailAndPassword(auth,email.trim(),password);}catch(e){throw friendly(e);}}
export async function signUp(name:string,email:string,password:string){if(password.length<8)throw new Error('Choose a password with at least 8 characters.');if(!name.trim())throw new Error('Enter your name.');try{const auth=await authReady();const result=await createUserWithEmailAndPassword(auth,email.trim(),password);await updateProfile(result.user,{displayName:name.trim().slice(0,80)});await result.user.getIdToken(true);}catch(e){throw friendly(e);}}
export async function resetPassword(email:string){try{const auth=await authReady();await sendPasswordResetEmail(auth,email.trim());}catch(e){if((e as {code?:string})?.code==='auth/user-not-found')return;throw friendly(e);}}
export async function signOut(){try{await firebaseSignOut(await authReady());}catch(e){throw friendly(e);}}
