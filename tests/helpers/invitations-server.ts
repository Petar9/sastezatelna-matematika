export const state:{mode:string;calls:{name:string;args:{p_email:string}}[];result:{data:boolean;error:unknown};throws:boolean}={mode:"hosted",calls:[],result:{data:true,error:null},throws:false};
export function reset(){state.mode="hosted";state.calls=[];state.result={data:true,error:null};state.throws=false;}
export function mode(){return state.mode;}
export function appOrigin(){return "https://maths.example";}
export function database(){return{rpc:async(name:string,args:{p_email:string})=>{state.calls.push({name,args});if(state.throws)throw new Error("Network failure");return state.result;}};}
