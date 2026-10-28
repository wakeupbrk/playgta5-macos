var Module=typeof Module!="undefined"?Module:{};var ENVIRONMENT_IS_WEB=!!globalThis.window;var ENVIRONMENT_IS_WORKER=!!globalThis.WorkerGlobalScope;var ENVIRONMENT_IS_NODE=globalThis.process?.versions?.node&&globalThis.process?.type!="renderer";var ENVIRONMENT_IS_PTHREAD=ENVIRONMENT_IS_WORKER&&globalThis.name=="em-pthread";(function(){const lines=[];const name=typeof ENVIRONMENT_IS_PTHREAD!=="undefined"&&ENVIRONMENT_IS_PTHREAD?"pthread":"main";const remoteLog=!!Module["remoteLog"]||/[?&]log=1/.test(self.location.search);let logChannel=null;globalThis.__logFlush=function(){if(!lines.length)return;try{(logChannel||(logChannel=new BroadcastChannel("game-log"))).postMessage(lines.splice(0).join("\n"))}catch(e){lines.length=0}};globalThis.__log=remoteLog?function(s){lines.push(s);globalThis.__logFlush()}:function(){};const ring=[];let crashSent=0;globalThis.__crash=function(kind,text){if(crashSent++>=3)return;try{new BroadcastChannel("game-crash").postMessage({kind,thread:name,text:String(text).slice(0,4e3),heap:typeof(growMemViews(),HEAPU8)!=="undefined"?(growMemViews(),HEAPU8).length/1048576|0:-1,tail:ring.slice()})}catch(e){}};addEventListener("error",function(e){const s="THREAD ERROR ("+name+"): "+(e.error&&e.error.stack||e.message);console.error(s);globalThis.__log(s);globalThis.__logFlush();globalThis.__crash("error",s)});const bc=new BroadcastChannel("game-progress");const stages=[[/^Audio rpf =/,24,"Mounting archives"],[/Using Settings/,38,"Reading settings"],[/created D3D11/,45,"Starting graphics"],[/CShaderLib::Init/,50,"Loading shaders"],[/LOAD_ADDITIONAL_TEXT - finished/,56,"Loading text"],[/Starting audio thread/,62,"Starting audio"],[/Loading singleplayer metadata/,66,"Loading audio metadata"],[/^Loading SRL file/,72,"Starting scripts"],[/Removing prologue IPL light groups/,84,"Loading the world"]];let sent=0,chose=false;const lastStage=stages[stages.length-1][1];function progress(s){if(!chose&&s.startsWith("[wasm] start mode: ")){const m=/^\[wasm\] start mode: (waiting|story|sandbox on env_test|sandbox|none)/.exec(s);if(m&&m[1]==="waiting")bc.postMessage({choice:true});else if(m){chose=true;bc.postMessage({commit:true,mode:{story:1,sandbox:2,"sandbox on env_test":3}[m[1]]||0})}return}if(sent>=lastStage)return;for(const st of stages)if(st[1]>sent&&st[0].test(s)){sent=st[1];bc.postMessage({pct:st[1],label:st[2]})}}const pending=[];let lastConsole=0,lastMem=0;function consoleLine(s){if(!s||/Hang Detect|^Pool |clashes with a global|from Loading effect|Couldn't find an enum name/.test(s))return;pending.push(s.length>200?s.slice(0,200):s);if(pending.length>40)pending.shift();const now=performance.now();if(remoteLog&&now-lastMem>5e3&&typeof(growMemViews(),HEAPU8)!=="undefined"){lastMem=now;globalThis.__log("[mem] wasm memory "+((growMemViews(),HEAPU8).length/1048576|0)+" MB ("+name+")"+(typeof PThread!=="undefined"&&PThread.runningWorkers?", pthreads running "+PThread.runningWorkers.length+", idle in pool "+PThread.unusedWorkers.length:""))}if(now-lastConsole>150){lastConsole=now;bc.postMessage({lines:pending.splice(0)})}}addEventListener("unhandledrejection",function(e){const s="THREAD REJECTION ("+name+"): "+(e.reason&&e.reason.stack||e.reason);console.error(s);globalThis.__log(s);globalThis.__logFlush();globalThis.__crash("rejection",s)});const fullConsole=!!Module["fullConsole"]||/[?&]console=1/.test(self.location.search);const important=/^(Error|Warning|Fatal|Assert|THREAD|ABORT|EXIT|\[wasm\]|\[io\]|\[wgpu\])|\*\* POSSIBLE STALL/;let consoleWindow=0,consoleShown=0,consoleHidden=0;function toConsole(s){if(fullConsole)return true;if(!important.test(s))return false;const now=performance.now();if(now-consoleWindow>=1e3){if(consoleHidden)console.warn("[console] "+consoleHidden+" lines of this thread not shown here (the server log has them; ?console=1 shows everything)");consoleWindow=now;consoleShown=0;consoleHidden=0}if(consoleShown<100){consoleShown++;return true}consoleHidden++;return false}Module["print"]=function(s){if(toConsole(s))console.log(s);globalThis.__log(s);progress(s);consoleLine(s);ring.push(s.length>300?s.slice(0,300):s);if(ring.length>60)ring.shift()};Module["printErr"]=function(s){if(toConsole(s))console.error(s);globalThis.__log(s);progress(s);consoleLine(s);ring.push(s.length>300?s.slice(0,300):s);if(ring.length>60)ring.shift()}})();var programArgs=[];var thisProgram="./this.program";var quit_=(status,toThrow)=>{throw toThrow};var _scriptName;if(ENVIRONMENT_IS_WORKER){_scriptName=self.location.href}var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var readAsync,readBinary;if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){try{scriptDirectory=new URL(".",_scriptName).href}catch{}{if(ENVIRONMENT_IS_WORKER){readBinary=url=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}readAsync=async url=>{var response=await fetch(url,{credentials:"same-origin"});if(response.ok){return response.arrayBuffer()}throw new Error(response.status+" : "+response.url)}}}else{}var out=console.log.bind(console);var err=console.error.bind(console);var wasmBinary;var wasmModule;var ABORT=false;var EXITSTATUS;class EmscriptenEH{}class EmscriptenSjLj extends EmscriptenEH{}function growMemViews(){if(wasmMemory.buffer!=HEAP8.buffer){updateMemoryViews()}}var startWorker;if(ENVIRONMENT_IS_PTHREAD){var initializedJS=false;self.onunhandledrejection=e=>{throw e.reason||e};function handleMessage(e){try{var msgData=e.data;var cmd=msgData.cmd;if(cmd==1){if(msgData.trainerSab)self.__trainerSab=msgData.trainerSab;let messageQueue=[];self.onmessage=e=>messageQueue.push(e);startWorker=()=>{postMessage({cmd:3});for(let msg of messageQueue){handleMessage(msg)}self.onmessage=handleMessage};for(const handler of msgData.handlers){if(!Module[handler]||Module[handler].proxy){Module[handler]=(...args)=>{postMessage({cmd:9,handler,args})};if(handler=="print")out=Module[handler];if(handler=="printErr")err=Module[handler]}}wasmMemory=msgData.wasmMemory;updateMemoryViews();wasmModule=msgData.wasmModule;createWasm();run();startWorker()}else if(cmd==2){establishStackSpace(msgData.pthread_ptr);__emscripten_thread_init(msgData.pthread_ptr,0,0,1,0,0);PThread.threadInitTLS();__emscripten_thread_mailbox_await(msgData.pthread_ptr);if(!initializedJS){initializedJS=true}try{invokeEntryPoint(msgData.start_routine,msgData.arg)}catch(ex){if(ex!="unwind"){throw ex}}}else if(cmd==4){if(initializedJS){checkMailbox()}}else if(cmd){err(`worker: received unknown command ${cmd}`);err(msgData)}}catch(ex){if(runtimeInitialized)__emscripten_thread_crashed();throw ex}}self.onmessage=handleMessage}var runtimeInitialized=false;var runtimeExited=false;function getMemoryBuffer(){return wasmMemory.buffer}function updateMemoryViews(){if(HEAP8?.buffer?.growable)return;var b=getMemoryBuffer();HEAP8=new Int8Array(b);HEAP16=new Int16Array(b);HEAPU8=new Uint8Array(b);HEAPU16=new Uint16Array(b);HEAP32=new Int32Array(b);HEAPU32=new Uint32Array(b);HEAPF64=new Float64Array(b);HEAP64=new BigInt64Array(b);HEAPU64=new BigUint64Array(b)}function initMemory(){if(ENVIRONMENT_IS_PTHREAD){return}{var INITIAL_MEMORY=3221225472;wasmMemory=new WebAssembly.Memory({initial:BigInt(INITIAL_MEMORY/65536),maximum:262144n,shared:true,address:"i64"})}updateMemoryViews()}function preRun(){var preRun=Module["preRun"];if(preRun){if(typeof preRun=="function")preRun=[preRun];onPreRuns.push(...preRun)}callRuntimeCallbacks(onPreRuns)}function initRuntime(){runtimeInitialized=true;if(ENVIRONMENT_IS_PTHREAD)return;SOCKFS.root=FS.mount(SOCKFS,{},null);if(!Module["noFSInit"]&&!FS.initialized)FS.init();TTY.init();wasmExports["__wasm_call_ctors"]();FS.ignorePermissions=false}function exitRuntime(){___funcs_on_exit();FS.quit();TTY.shutdown();PThread.terminateRuntime();runtimeExited=true}function postRun(){var postRun=Module["postRun"];if(postRun){if(typeof postRun=="function")postRun=[postRun];onPostRuns.push(...postRun)}callRuntimeCallbacks(onPostRuns)}function abort(what){Module["onAbort"]?.(what);what=`Aborted(${what})`;err(what);ABORT=true;what+=". Build with -sASSERTIONS for more info.";var e=new WebAssembly.RuntimeError(what);throw e}var wasmBinaryFile;function findWasmBinary(){return locateFile("game.wasm")}function getBinarySync(file){if(readBinary){return readBinary(file)}throw"both async and sync fetching of the wasm failed"}async function getWasmBinary(binaryFile){if(!wasmBinary){try{var response=await readAsync(binaryFile);return new Uint8Array(response)}catch{}}return getBinarySync(binaryFile)}async function instantiateArrayBuffer(binaryFile,imports){try{var binary=await getWasmBinary(binaryFile);var instance=await WebAssembly.instantiate(binary,imports);return instance}catch(reason){err(`failed to asynchronously prepare wasm: ${reason}`);abort(reason)}}async function instantiateAsync(binary,binaryFile,imports){if(!binary){try{var response=fetch(binaryFile,{credentials:"same-origin"});var instantiationResult=await WebAssembly.instantiateStreaming(response,imports);return instantiationResult}catch(reason){err(`wasm streaming compile failed: ${reason}`);err("falling back to ArrayBuffer instantiation")}}return instantiateArrayBuffer(binaryFile,imports)}function getWasmImports(){assignWasmImports();var imports={env:wasmImports,wasi_snapshot_preview1:wasmImports};return imports}async function createWasm(){function receiveInstance(instance,module){wasmExports=instance.exports;wasmExports=applySignatureConversions(wasmExports);registerTLSInit(wasmExports["_emscripten_tls_init"]);assignWasmExports(wasmExports);wasmModule=module;try{installGtaTrainer(wasmExports)}catch(e){console.error(e)}return wasmExports}function receiveInstantiationResult(result){return receiveInstance(result["instance"],result["module"])}var info=getWasmImports();var instantiateWasm=Module["instantiateWasm"];if(instantiateWasm){return new Promise(resolve=>{instantiateWasm(info,(inst,mod)=>resolve(receiveInstance(inst,mod)))})}if(ENVIRONMENT_IS_PTHREAD){var instance=new WebAssembly.Instance(wasmModule,getWasmImports());return receiveInstance(instance,wasmModule)}wasmBinaryFile??=findWasmBinary();var result=await instantiateAsync(wasmBinary,wasmBinaryFile,info);var exports=receiveInstantiationResult(result);return exports}class ExitStatus{name="ExitStatus";constructor(status){this.message=`Program terminated with exit(${status})`;this.status=status}}var HEAP8;var terminateWorker=worker=>{worker.terminate();worker.onmessage=e=>{}};var cleanupThread=pthread_ptr=>{var worker=PThread.pthreads[pthread_ptr];PThread.returnWorkerToPool(worker)};var callRuntimeCallbacks=callbacks=>{while(callbacks.length>0){callbacks.shift()(Module)}};var onPreRuns=[];var addOnPreRun=cb=>onPreRuns.push(cb);var dependenciesPromise=null;var resolveRunDependencies=async()=>dependenciesPromise;var runDependencies=0;var dependenciesPromiseResolve=null;var removeRunDependency=id=>{runDependencies--;Module["monitorRunDependencies"]?.(runDependencies);if(!runDependencies){dependenciesPromiseResolve()}};var addRunDependency=id=>{if(!runDependencies){dependenciesPromise=new Promise(resolve=>dependenciesPromiseResolve=resolve)}runDependencies++;Module["monitorRunDependencies"]?.(runDependencies)};var spawnThread=threadParams=>{var worker=PThread.getNewWorker();if(!worker){return 6}PThread.pthreads[threadParams.pthread_ptr]=worker;worker.pthread_ptr=threadParams.pthread_ptr;var msg={cmd:2,start_routine:threadParams.startRoutine,arg:threadParams.arg,pthread_ptr:threadParams.pthread_ptr};worker.postMessage(msg,threadParams.transferList);return 0};var runtimeKeepaliveCounter=0;var keepRuntimeAlive=()=>noExitRuntime||runtimeKeepaliveCounter>0;var stackSave=()=>_emscripten_stack_get_current();var stackRestore=val=>__emscripten_stack_restore(val);var stackAlloc=sz=>__emscripten_stack_alloc(sz);var HEAPF64;var HEAP64;var proxyToMainThread=(funcIndex,emAsmAddr,proxyMode,...callArgs)=>{var bufSize=8*callArgs.length*2;var sp=stackSave();var args=stackAlloc(bufSize);var b=args/8;for(var arg of callArgs){if(typeof arg=="bigint"){(growMemViews(),HEAP64)[b++]=1n;(growMemViews(),HEAP64)[b++]=arg}else{(growMemViews(),HEAP64)[b++]=0n;(growMemViews(),HEAPF64)[b++]=arg}}var rtn=__emscripten_run_js_on_main_thread(funcIndex,emAsmAddr,bufSize,args,proxyMode);stackRestore(sp);return rtn};function _proc_exit(code){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(0,0,1,code);EXITSTATUS=code;if(!keepRuntimeAlive()){PThread.terminateAllThreads();Module["onExit"]?.(code);ABORT=true}quit_(code,new ExitStatus(code))}function exitOnMainThread(returnCode){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(1,0,0,returnCode);_exit(returnCode)}var exitJS=(status,implicit)=>{EXITSTATUS=status;if(ENVIRONMENT_IS_PTHREAD){exitOnMainThread(status);throw"unwind"}if(!keepRuntimeAlive()){exitRuntime()}_proc_exit(status)};var _exit=exitJS;var waitAsyncPolyfilled=!Atomics.waitAsync||globalThis.navigator?.userAgent&&Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2])<91;var HEAP32;var PThread={unusedWorkers:[],tlsInitFunctions:[],pthreads:{},init(){if(!ENVIRONMENT_IS_PTHREAD){PThread.initMainThread()}},initMainThread(){var pthreadPoolSize=Math.min(160,navigator.hardwareConcurrency<=2?28:36+4*navigator.hardwareConcurrency);while(pthreadPoolSize--){PThread.allocateUnusedWorker()}addOnPreRun(async()=>{var pthreadPoolReady=PThread.loadWasmModuleToAllWorkers();addRunDependency("loading-workers");await pthreadPoolReady;removeRunDependency("loading-workers")})},terminateAllThreads:()=>{for(var worker of Object.values(PThread.pthreads)){terminateWorker(worker)}for(var worker of PThread.unusedWorkers){terminateWorker(worker)}PThread.unusedWorkers=[];PThread.pthreads={}},clearMailboxAwait:pthread_ptr=>{if(!waitAsyncPolyfilled){Atomics.notify((growMemViews(),HEAP32),pthread_ptr/4)}},terminateRuntime:()=>{PThread.terminateAllThreads();var pthread_ptr=_pthread_self();___set_thread_state(0,0,0,1);PThread.clearMailboxAwait(pthread_ptr)},returnWorkerToPool:worker=>{var pthread_ptr=worker.pthread_ptr;delete PThread.pthreads[pthread_ptr];PThread.unusedWorkers.push(worker);worker.pthread_ptr=0;PThread.clearMailboxAwait(pthread_ptr);__emscripten_thread_free_data(pthread_ptr)},threadInitTLS(){PThread.tlsInitFunctions.forEach(f=>f())},loadWasmModuleToWorker:worker=>new Promise(onFinishedLoading=>{worker.onmessage=e=>{var d=e.data;var cmd=d.cmd;if(d.targetThread&&d.targetThread!=_pthread_self()){var targetWorker=PThread.pthreads[d.targetThread];targetWorker?.postMessage(d);return}if(d==="setimmediate"||d==="_si"){worker.postMessage(d);return}switch(cmd){case 4:checkMailbox();break;case 5:spawnThread(d);break;case 6:callUserCallback(()=>cleanupThread(d.thread));break;case 3:onFinishedLoading(worker);break;case 9:Module[d.handler](...d.args);break;default:if(cmd)err(`worker sent an unknown command ${cmd}`)}};worker.onerror=e=>{var message="worker sent an error!";err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);throw e};var handlers=[];var knownHandlers=["onExit","onAbort","print","printErr"];for(var handler of knownHandlers){if(Module.propertyIsEnumerable(handler)){handlers.push(handler)}}worker.postMessage({cmd:1,handlers,wasmMemory,wasmModule,trainerSab:self.__trainerSab||(typeof Module!=="undefined"?Module.trainerSab:null)})}),async loadWasmModuleToAllWorkers(){if(ENVIRONMENT_IS_PTHREAD){return}let pthreadPoolReady=Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));return pthreadPoolReady},allocateUnusedWorker(){var worker;var pthreadMainJs=_scriptName;if(Module["mainScriptUrlOrBlob"]){pthreadMainJs=Module["mainScriptUrlOrBlob"];if(typeof pthreadMainJs!="string"){pthreadMainJs=URL.createObjectURL(pthreadMainJs)}}worker=new Worker(pthreadMainJs,{name:"em-pthread"});PThread.unusedWorkers.push(worker);return worker},getNewWorker(){if(PThread.unusedWorkers.length==0){var newWorker=PThread.allocateUnusedWorker();PThread.loadWasmModuleToWorker(newWorker)}return PThread.unusedWorkers.pop()}};var onPostRuns=[];var HEAPU64;function establishStackSpace(pthread_ptr){var stackHigh=Number((growMemViews(),HEAPU64)[(pthread_ptr+80)/8]);var stackSize=Number((growMemViews(),HEAPU64)[(pthread_ptr+88)/8]);var stackLow=stackHigh-stackSize;_emscripten_stack_set_limits(stackHigh,stackLow);stackRestore(stackHigh)}var wasmTableMirror=[];var getWasmTableEntry=funcPtr=>{funcPtr=Number(funcPtr);var func=wasmTableMirror[funcPtr];if(!func){wasmTableMirror[funcPtr]=func=wasmTable.get(BigInt(funcPtr))}return func};var invokeEntryPoint=(ptr,arg)=>{runtimeKeepaliveCounter=0;noExitRuntime=0;var result=(a1=>Number(getWasmTableEntry(ptr).call(null,BigInt(a1))))(arg);function finish(result){if(keepRuntimeAlive()){EXITSTATUS=result;return}__emscripten_thread_exit(result)}finish(result)};var noExitRuntime=false;var registerTLSInit=tlsInitFunc=>PThread.tlsInitFunctions.push(tlsInitFunc);var wasmMemory;function pthreadCreateProxied(pthread_ptr,attr,startRoutine,arg){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(2,0,1,pthread_ptr,attr,startRoutine,arg);return ___pthread_create_js(pthread_ptr,attr,startRoutine,arg)}var _emscripten_has_threading_support=()=>!!globalThis.SharedArrayBuffer;var INT53_MAX=9007199254740992;var INT53_MIN=-9007199254740992;var bigintToI53Checked=num=>num<INT53_MIN||num>INT53_MAX?NaN:Number(num);function ___pthread_create_js(pthread_ptr,attr,startRoutine,arg){pthread_ptr=bigintToI53Checked(pthread_ptr);attr=bigintToI53Checked(attr);startRoutine=bigintToI53Checked(startRoutine);arg=bigintToI53Checked(arg);if(!_emscripten_has_threading_support()){return 6}var transferList=[];var error=0;if(ENVIRONMENT_IS_PTHREAD&&(!transferList.length||error)){return pthreadCreateProxied(pthread_ptr,attr,startRoutine,arg)}if(error)return error;var threadParams={startRoutine,pthread_ptr,arg,transferList};if(ENVIRONMENT_IS_PTHREAD){threadParams.cmd=5;postMessage(threadParams,transferList);return 0}return spawnThread(threadParams)}var initRandomFill=()=>view=>(view.set(crypto.getRandomValues(new Uint8Array(view.byteLength))),0);var randomFill=view=>(randomFill=initRandomFill())(view);var PATH={isAbs:path=>path.charAt(0)==="/",splitPath:filename=>{var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;return splitPathRe.exec(filename).slice(1)},normalizeArray:(parts,allowAboveRoot)=>{var up=0;for(var i=parts.length-1;i>=0;i--){var last=parts[i];if(last==="."){parts.splice(i,1)}else if(last===".."){parts.splice(i,1);up++}else if(up){parts.splice(i,1);up--}}if(allowAboveRoot){for(;up;up--){parts.unshift("..")}}return parts},normalize:path=>{var isAbsolute=PATH.isAbs(path),trailingSlash=path.slice(-1)==="/";path=PATH.normalizeArray(path.split("/").filter(p=>!!p),!isAbsolute).join("/");if(!path&&!isAbsolute){path="."}if(path&&trailingSlash){path+="/"}return(isAbsolute?"/":"")+path},dirname:path=>{var result=PATH.splitPath(path),root=result[0],dir=result[1];if(!root&&!dir){return"."}if(dir){dir=dir.slice(0,-1)}return root+dir},basename:path=>path&&path.match(/([^\/]+|\/)\/*$/)[1],join:(...paths)=>PATH.normalize(paths.join("/")),join2:(l,r)=>PATH.normalize(l+"/"+r)};var PATH_FS={resolve:(...args)=>{var resolvedPath="",resolvedAbsolute=false;for(var i=args.length-1;i>=-1&&!resolvedAbsolute;i--){var path=i>=0?args[i]:FS.cwd();if(typeof path!="string"){throw new TypeError("Arguments to path.resolve must be strings")}else if(!path){return""}resolvedPath=path+"/"+resolvedPath;resolvedAbsolute=PATH.isAbs(path)}resolvedPath=PATH.normalizeArray(resolvedPath.split("/").filter(p=>!!p),!resolvedAbsolute).join("/");return(resolvedAbsolute?"/":"")+resolvedPath||"."},relative:(from,to)=>{from=PATH_FS.resolve(from).slice(1);to=PATH_FS.resolve(to).slice(1);function trim(arr){var start=0;for(;start<arr.length;start++){if(arr[start]!=="")break}var end=arr.length-1;for(;end>=0;end--){if(arr[end]!=="")break}if(start>end)return[];return arr.slice(start,end-start+1)}var fromParts=trim(from.split("/"));var toParts=trim(to.split("/"));var length=Math.min(fromParts.length,toParts.length);var samePartsLength=length;for(var i=0;i<length;i++){if(fromParts[i]!==toParts[i]){samePartsLength=i;break}}var outputParts=[];for(var i=samePartsLength;i<fromParts.length;i++){outputParts.push("..")}outputParts=outputParts.concat(toParts.slice(samePartsLength));return outputParts.join("/")}};var UTF8Decoder=globalThis.TextDecoder&&new TextDecoder;var findStringEnd=(heapOrArray,idx,maxBytesToRead,ignoreNul)=>{var maxIdx=idx+maxBytesToRead;if(ignoreNul)return maxIdx;while(heapOrArray[idx]&&!(idx>=maxIdx))++idx;return idx};var UTF8ArrayToString=(heapOrArray,idx=0,maxBytesToRead,ignoreNul)=>{var endPtr=findStringEnd(heapOrArray,idx,maxBytesToRead,ignoreNul);if(endPtr-idx>16&&heapOrArray.buffer&&UTF8Decoder){return UTF8Decoder.decode(heapOrArray.buffer instanceof ArrayBuffer?heapOrArray.subarray(idx,endPtr):heapOrArray.slice(idx,endPtr))}var str="";while(idx<endPtr){var u0=heapOrArray[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heapOrArray[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heapOrArray[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heapOrArray[idx++]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}return str};var FS_stdin_getChar_buffer=[];var lengthBytesUTF8=str=>{var len=0;for(var i=0;i<str.length;++i){var c=str.charCodeAt(i);if(c<=127){len++}else if(c<=2047){len+=2}else if(c>=55296&&c<=57343){len+=4;++i}else{len+=3}}return len};var stringToUTF8Array=(str,heap,outIdx,maxBytesToWrite)=>{if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.codePointAt(i);if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}else{if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63;i++}}heap[outIdx]=0;return outIdx-startIdx};var intArrayFromString=(stringy,dontAddNull,length)=>{var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array};var FS_stdin_getChar=()=>{if(!FS_stdin_getChar_buffer.length){var result=null;{}if(!result){return null}FS_stdin_getChar_buffer=intArrayFromString(result,true)}return FS_stdin_getChar_buffer.shift()};var TTY={ttys:[],init(){},shutdown(){},register(dev,ops){TTY.ttys[dev]={input:[],output:[],ops};FS.registerDevice(dev,TTY.stream_ops)},stream_ops:{open(stream){var tty=TTY.ttys[stream.node.rdev];if(!tty){throw new FS.ErrnoError(43)}stream.tty=tty;stream.seekable=false},close(stream){stream.tty.ops.fsync(stream.tty)},fsync(stream){stream.tty.ops.fsync(stream.tty)},read(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.get_char){throw new FS.ErrnoError(60)}var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=stream.tty.ops.get_char(stream.tty)}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&!bytesRead){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result;if(result===10)break}if(bytesRead){stream.node.atime=Date.now()}return bytesRead},write(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.put_char){throw new FS.ErrnoError(60)}try{for(var i=0;i<length;i++){stream.tty.ops.put_char(stream.tty,buffer[offset+i])}}catch(e){throw new FS.ErrnoError(29)}if(length){stream.node.mtime=stream.node.ctime=Date.now()}return i}},default_tty_ops:{get_char(tty){return FS_stdin_getChar()},put_char(tty,val){if(val===null||val===10){out(UTF8ArrayToString(tty.output));tty.output=[]}else{if(val!=0)tty.output.push(val)}},fsync(tty){if(tty.output?.length>0){out(UTF8ArrayToString(tty.output));tty.output=[]}},ioctl_tcgets(tty){return{c_iflag:25856,c_oflag:5,c_cflag:191,c_lflag:35387,c_cc:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},ioctl_tcsets(tty,optional_actions,data){return 0},ioctl_tiocgwinsz(tty){return[24,80]}},default_tty1_ops:{put_char(tty,val){if(val===null||val===10){err(UTF8ArrayToString(tty.output));tty.output=[]}else{if(val!=0)tty.output.push(val)}},fsync(tty){if(tty.output?.length>0){err(UTF8ArrayToString(tty.output));tty.output=[]}}}};var mmapAlloc=size=>{abort()};var MEMFS={ops_table:null,mount(mount){return MEMFS.createNode(null,"/",16895,0)},createNode(parent,name,mode,dev){if(FS.isBlkdev(mode)||FS.isFIFO(mode)){throw new FS.ErrnoError(63)}MEMFS.ops_table||={dir:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,lookup:MEMFS.node_ops.lookup,mknod:MEMFS.node_ops.mknod,rename:MEMFS.node_ops.rename,unlink:MEMFS.node_ops.unlink,rmdir:MEMFS.node_ops.rmdir,readdir:MEMFS.node_ops.readdir,symlink:MEMFS.node_ops.symlink},stream:{llseek:MEMFS.stream_ops.llseek}},file:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:{llseek:MEMFS.stream_ops.llseek,read:MEMFS.stream_ops.read,write:MEMFS.stream_ops.write,mmap:MEMFS.stream_ops.mmap,msync:MEMFS.stream_ops.msync}},link:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,readlink:MEMFS.node_ops.readlink},stream:{}},chrdev:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:FS.chrdev_stream_ops}};var node=FS.createNode(parent,name,mode,dev);if(FS.isDir(node.mode)){node.node_ops=MEMFS.ops_table.dir.node;node.stream_ops=MEMFS.ops_table.dir.stream;node.contents={}}else if(FS.isFile(node.mode)){node.node_ops=MEMFS.ops_table.file.node;node.stream_ops=MEMFS.ops_table.file.stream;node.usedBytes=0;node.contents=MEMFS.emptyFileContents??=new Uint8Array(0)}else if(FS.isLink(node.mode)){node.node_ops=MEMFS.ops_table.link.node;node.stream_ops=MEMFS.ops_table.link.stream}else if(FS.isChrdev(node.mode)){node.node_ops=MEMFS.ops_table.chrdev.node;node.stream_ops=MEMFS.ops_table.chrdev.stream}node.atime=node.mtime=node.ctime=Date.now();if(parent){parent.contents[name]=node;parent.atime=parent.mtime=parent.ctime=node.atime}return node},getFileDataAsTypedArray(node){return node.contents.subarray(0,node.usedBytes)},expandFileStorage(node,newCapacity){var prevCapacity=node.contents.length;if(prevCapacity>=newCapacity)return;var CAPACITY_DOUBLING_MAX=1024*1024;newCapacity=Math.max(newCapacity,prevCapacity*(prevCapacity<CAPACITY_DOUBLING_MAX?2:1.125)>>>0);if(prevCapacity)newCapacity=Math.max(newCapacity,256);var oldContents=MEMFS.getFileDataAsTypedArray(node);node.contents=new Uint8Array(newCapacity);node.contents.set(oldContents)},resizeFileStorage(node,newSize){if(node.usedBytes==newSize)return;var oldContents=node.contents;node.contents=new Uint8Array(newSize);node.contents.set(oldContents.subarray(0,Math.min(newSize,node.usedBytes)));node.usedBytes=newSize},node_ops:{getattr(node){var attr={};attr.dev=FS.isChrdev(node.mode)?node.id:1;attr.ino=node.id;attr.mode=node.mode;attr.nlink=1;attr.uid=0;attr.gid=0;attr.rdev=node.rdev;if(FS.isDir(node.mode)){attr.size=4096}else if(FS.isFile(node.mode)){attr.size=node.usedBytes}else if(FS.isLink(node.mode)){attr.size=node.link.length}else{attr.size=0}attr.atime=new Date(node.atime);attr.mtime=new Date(node.mtime);attr.ctime=new Date(node.ctime);attr.blksize=4096;attr.blocks=Math.ceil(attr.size/attr.blksize);return attr},setattr(node,attr){for(const key of["mode","atime","mtime","ctime"]){if(attr[key]!=null){node[key]=attr[key]}}if(attr.size!==undefined){MEMFS.resizeFileStorage(node,attr.size)}},lookup(parent,name){if(!MEMFS.doesNotExistError){MEMFS.doesNotExistError=new FS.ErrnoError(44);MEMFS.doesNotExistError.stack="<generic error, no stack>"}throw MEMFS.doesNotExistError},mknod(parent,name,mode,dev){return MEMFS.createNode(parent,name,mode,dev)},rename(old_node,new_dir,new_name){var new_node;try{new_node=FS.lookupNode(new_dir,new_name)}catch(e){}if(new_node){if(FS.isDir(old_node.mode)){for(var i in new_node.contents){throw new FS.ErrnoError(55)}}FS.hashRemoveNode(new_node)}delete old_node.parent.contents[old_node.name];new_dir.contents[new_name]=old_node;old_node.name=new_name;new_dir.ctime=new_dir.mtime=old_node.parent.ctime=old_node.parent.mtime=Date.now()},unlink(parent,name){delete parent.contents[name];parent.ctime=parent.mtime=Date.now()},rmdir(parent,name){var node=FS.lookupNode(parent,name);for(var i in node.contents){throw new FS.ErrnoError(55)}delete parent.contents[name];parent.ctime=parent.mtime=Date.now()},readdir(node){return[".","..",...Object.keys(node.contents)]},symlink(parent,newname,oldpath){var node=MEMFS.createNode(parent,newname,511|40960,0);node.link=oldpath;return node},readlink(node){if(!FS.isLink(node.mode)){throw new FS.ErrnoError(28)}return node.link}},stream_ops:{read(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=stream.node.usedBytes)return 0;var size=Math.min(stream.node.usedBytes-position,length);buffer.set(contents.subarray(position,position+size),offset);return size},write(stream,buffer,offset,length,position,canOwn){if(buffer.buffer===(growMemViews(),HEAP8).buffer){canOwn=false}if(!length)return 0;var node=stream.node;node.mtime=node.ctime=Date.now();if(canOwn){node.contents=buffer.subarray(offset,offset+length);node.usedBytes=length}else if(!node.usedBytes&&!position){node.contents=buffer.slice(offset,offset+length);node.usedBytes=length}else{MEMFS.expandFileStorage(node,position+length);node.contents.set(buffer.subarray(offset,offset+length),position);node.usedBytes=Math.max(node.usedBytes,position+length)}return length},llseek(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position}else if(whence===2){if(FS.isFile(stream.node.mode)){position+=stream.node.usedBytes}}if(position<0){throw new FS.ErrnoError(28)}return position},mmap(stream,length,position,prot,flags){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}var ptr;var allocated;var contents=stream.node.contents;if(!(flags&2)&&contents.buffer===(growMemViews(),HEAP8).buffer){allocated=false;ptr=contents.byteOffset}else{allocated=true;ptr=mmapAlloc(length);if(!ptr){throw new FS.ErrnoError(48)}if(contents){if(position>0||position+length<contents.length){if(contents.subarray){contents=contents.subarray(position,position+length)}else{contents=Array.prototype.slice.call(contents,position,position+length)}}(growMemViews(),HEAP8).set(contents,ptr)}}return{ptr,allocated}},msync(stream,buffer,offset,length,mmapFlags){MEMFS.stream_ops.write(stream,buffer,0,length,offset,false);return 0}}};var FS_modeStringToFlags=str=>{if(typeof str!="string")return str;var flagModes={r:0,"r+":2,w:512|64|1,"w+":512|64|2,a:1024|64|1,"a+":1024|64|2};var flags=flagModes[str];if(typeof flags=="undefined"){throw new Error(`Unknown file open mode: ${str}`)}return flags};var FS_fileDataToTypedArray=data=>{if(typeof data=="string"){data=intArrayFromString(data,true)}if(!data.subarray){data=new Uint8Array(data)}return data};var FS_getMode=(canRead,canWrite)=>{var mode=0;if(canRead)mode|=292|73;if(canWrite)mode|=146;return mode};var asyncLoad=async url=>{var arrayBuffer=await readAsync(url);return new Uint8Array(arrayBuffer)};var FS_createDataFile=(...args)=>FS.createDataFile(...args);var getUniqueRunDependency=id=>id;var preloadPlugins=[];var FS_handledByPreloadPlugin=async(byteArray,fullname)=>{if(typeof Browser!="undefined")Browser.init();for(var plugin of preloadPlugins){if(plugin["canHandle"](fullname)){return plugin["handle"](byteArray,fullname)}}return byteArray};var FS_preloadFile=async(parent,name,url,canRead,canWrite,dontCreateFile,canOwn,preFinish)=>{var fullname=name?PATH_FS.resolve(PATH.join2(parent,name)):parent;var dep=getUniqueRunDependency(`cp ${fullname}`);addRunDependency(dep);try{var byteArray=url;if(typeof url=="string"){byteArray=await asyncLoad(url)}byteArray=await FS_handledByPreloadPlugin(byteArray,fullname);preFinish?.();if(!dontCreateFile){FS_createDataFile(parent,name,byteArray,canRead,canWrite,canOwn)}}finally{removeRunDependency(dep)}};var FS_createPreloadedFile=(parent,name,url,canRead,canWrite,onload,onerror,dontCreateFile,canOwn,preFinish)=>{FS_preloadFile(parent,name,url,canRead,canWrite,dontCreateFile,canOwn,preFinish).then(onload).catch(onerror)};var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,filesystems:null,syncFSRequests:0,ErrnoError:class{name="ErrnoError";constructor(errno){this.errno=errno}},FSStream:class{shared={};get object(){return this.node}set object(val){this.node=val}get isRead(){return(this.flags&2097155)!==1}get isWrite(){return(this.flags&2097155)!==0}get isAppend(){return this.flags&1024}get flags(){return this.shared.flags}set flags(val){this.shared.flags=val}get position(){return this.shared.position}set position(val){this.shared.position=val}},FSNode:class{node_ops={};stream_ops={};readMode=292|73;writeMode=146;mounted=null;constructor(parent,name,mode,rdev){if(!parent){parent=this}this.parent=parent;this.mount=parent.mount;this.id=FS.nextInode++;this.name=name;this.mode=mode;this.rdev=rdev;this.atime=this.mtime=this.ctime=Date.now()}get read(){return(this.mode&this.readMode)===this.readMode}set read(val){val?this.mode|=this.readMode:this.mode&=~this.readMode}get write(){return(this.mode&this.writeMode)===this.writeMode}set write(val){val?this.mode|=this.writeMode:this.mode&=~this.writeMode}get isFolder(){return FS.isDir(this.mode)}get isDevice(){return FS.isChrdev(this.mode)}addListener(cb,exclusive=false){var entry={cb,exclusive};var listeners=this.listeners??=new Set;listeners.add(entry);return{listeners,entry}}notifyListeners(flags){if(!this.listeners)return;var excl;for(var entry of this.listeners){if(entry.exclusive)(excl||=[]).push(entry);else entry.cb(flags)}if(excl){var i=(this.exclTurn||0)%excl.length;this.exclTurn=i+1;excl[i].cb(flags)}}},lookupPath(path,opts={}){if(!path){throw new FS.ErrnoError(44)}opts.follow_mount??=true;if(!PATH.isAbs(path)){path=FS.cwd()+"/"+path}linkloop:for(var nlinks=0;nlinks<40;nlinks++){var parts=path.split("/").filter(p=>!!p);var current=FS.root;var current_path="/";for(var i=0;i<parts.length;i++){var islast=i===parts.length-1;if(islast&&opts.parent){break}if(parts[i]==="."){continue}if(parts[i]===".."){current_path=PATH.dirname(current_path);if(FS.isRoot(current)){path=current_path+"/"+parts.slice(i+1).join("/");nlinks--;continue linkloop}else{current=current.parent}continue}current_path=PATH.join2(current_path,parts[i]);try{current=FS.lookupNode(current,parts[i])}catch(e){if(e?.errno===44&&islast&&opts.noent_okay){return{path:current_path}}throw e}if(FS.isMountpoint(current)&&(!islast||opts.follow_mount)){current=current.mounted.root}if(FS.isLink(current.mode)&&(!islast||opts.follow)){if(!current.node_ops.readlink){throw new FS.ErrnoError(52)}var link=current.node_ops.readlink(current);if(!PATH.isAbs(link)){link=PATH.dirname(current_path)+"/"+link}path=link+"/"+parts.slice(i+1).join("/");continue linkloop}}return{path:current_path,node:current}}throw new FS.ErrnoError(32)},getPath(node){var path;while(true){if(FS.isRoot(node)){var mount=node.mount.mountpoint;if(!path)return mount;return mount[mount.length-1]!=="/"?`${mount}/${path}`:mount+path}path=path?`${node.name}/${path}`:node.name;node=node.parent}},hashName(parentid,name){var hash=0;for(var i=0;i<name.length;i++){hash=(hash<<5)-hash+name.charCodeAt(i)|0}return(parentid+hash>>>0)%FS.nameTable.length},hashAddNode(node){var hash=FS.hashName(node.parent.id,node.name);node.name_next=FS.nameTable[hash];FS.nameTable[hash]=node},hashRemoveNode(node){var hash=FS.hashName(node.parent.id,node.name);if(FS.nameTable[hash]===node){FS.nameTable[hash]=node.name_next}else{var current=FS.nameTable[hash];while(current){if(current.name_next===node){current.name_next=node.name_next;break}current=current.name_next}}},lookupNode(parent,name){var errCode=FS.mayLookup(parent);if(errCode){throw new FS.ErrnoError(errCode)}var hash=FS.hashName(parent.id,name);for(var node=FS.nameTable[hash];node;node=node.name_next){var nodeName=node.name;if(node.parent.id===parent.id&&nodeName===name){return node}}return FS.lookup(parent,name)},createNode(parent,name,mode,rdev){var node=new FS.FSNode(parent,name,mode,rdev);FS.hashAddNode(node);return node},destroyNode(node){FS.hashRemoveNode(node)},isRoot(node){return node===node.parent},isMountpoint(node){return!!node.mounted},isFile(mode){return(mode&61440)===32768},isDir(mode){return(mode&61440)===16384},isLink(mode){return(mode&61440)===40960},isChrdev(mode){return(mode&61440)===8192},isBlkdev(mode){return(mode&61440)===24576},isFIFO(mode){return(mode&61440)===4096},isSocket(mode){return(mode&49152)===49152},flagsToPermissionString(flag){var perms=["r","w","rw"][flag&3];if(flag&512){perms+="w"}return perms},nodePermissions(node,perms){if(FS.ignorePermissions){return 0}if(perms.includes("r")&&!(node.mode&292)){return 2}if(perms.includes("w")&&!(node.mode&146)){return 2}if(perms.includes("x")&&!(node.mode&73)){return 2}return 0},mayLookup(dir){if(!FS.isDir(dir.mode))return 54;var errCode=FS.nodePermissions(dir,"x");if(errCode)return errCode;if(!dir.node_ops.lookup)return 2;return 0},mayCreate(dir,name){if(!FS.isDir(dir.mode)){return 54}try{var node=FS.lookupNode(dir,name);return 20}catch(e){}return FS.nodePermissions(dir,"wx")},mayDelete(dir,name,isdir){var node;try{node=FS.lookupNode(dir,name)}catch(e){return e.errno}var errCode=FS.nodePermissions(dir,"wx");if(errCode){return errCode}if(isdir){if(!FS.isDir(node.mode)){return 54}if(FS.isRoot(node)||FS.getPath(node)===FS.cwd()){return 10}}else if(FS.isDir(node.mode)){return 31}return 0},mayOpen(node,flags){if(!node){return 44}if(FS.isLink(node.mode)){return 32}var mode=FS.flagsToPermissionString(flags);if(FS.isDir(node.mode)){if(mode!=="r"||flags&(512|64)){return 31}}return FS.nodePermissions(node,mode)},checkOpExists(op,err){if(!op){throw new FS.ErrnoError(err)}return op},MAX_OPEN_FDS:4096,nextfd(){for(var fd=0;fd<=FS.MAX_OPEN_FDS;fd++){if(!FS.streams[fd]){return fd}}throw new FS.ErrnoError(33)},getStreamChecked(fd){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(8)}return stream},getStream:fd=>FS.streams[fd],createStream(stream,fd=-1){stream=Object.assign(new FS.FSStream,stream);if(fd==-1){fd=FS.nextfd()}stream.fd=fd;FS.streams[fd]=stream;return stream},closeStream(fd){FS.streams[fd]=null},dupStream(origStream,fd=-1){var stream=FS.createStream(origStream,fd);stream.stream_ops?.dup?.(stream);return stream},doSetAttr(stream,node,attr){var setattr=stream?.stream_ops.setattr;var arg=setattr?stream:node;setattr??=node.node_ops.setattr;FS.checkOpExists(setattr,63);try{setattr(arg,attr)}catch(e){if(e instanceof RangeError){throw new FS.ErrnoError(22)}throw e}},chrdev_stream_ops:{open(stream){var device=FS.getDevice(stream.node.rdev);stream.stream_ops=device.stream_ops;stream.stream_ops.open?.(stream)},llseek(){throw new FS.ErrnoError(70)}},major:dev=>dev>>8,minor:dev=>dev&255,makedev:(ma,mi)=>ma<<8|mi,registerDevice(dev,ops){FS.devices[dev]={stream_ops:ops}},getDevice:dev=>FS.devices[dev],getMounts(mount){var mounts=[];var check=[mount];while(check.length){var m=check.pop();mounts.push(m);check.push(...m.mounts)}return mounts},syncfs(populate,callback){if(typeof populate=="function"){callback=populate;populate=false}FS.syncFSRequests++;if(FS.syncFSRequests>1){err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`)}var mounts=FS.getMounts(FS.root.mount);var completed=0;function doCallback(errCode){FS.syncFSRequests--;return callback(errCode)}function done(errCode){if(errCode){if(!done.errored){done.errored=true;return doCallback(errCode)}return}if(++completed>=mounts.length){doCallback(null)}}for(var mount of mounts){if(mount.type.syncfs){mount.type.syncfs(mount,populate,done)}else{done(null)}}},mount(type,opts,mountpoint){var root=mountpoint==="/";var pseudo=!mountpoint;var node;if(root&&FS.root){throw new FS.ErrnoError(10)}else if(!root&&!pseudo){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});mountpoint=lookup.path;node=lookup.node;if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}if(!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}}var mount={type,opts,mountpoint,mounts:[]};var mountRoot=type.mount(mount);mountRoot.mount=mount;mount.root=mountRoot;if(root){FS.root=mountRoot}else if(node){node.mounted=mount;if(node.mount){node.mount.mounts.push(mount)}}return mountRoot},unmount(mountpoint){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});if(!FS.isMountpoint(lookup.node)){throw new FS.ErrnoError(28)}var node=lookup.node;var mount=node.mounted;var mounts=FS.getMounts(mount);for(var[hash,current]of Object.entries(FS.nameTable)){while(current){var next=current.name_next;if(mounts.includes(current.mount)){FS.destroyNode(current)}current=next}}node.mounted=null;var idx=node.mount.mounts.indexOf(mount);node.mount.mounts.splice(idx,1)},lookup(parent,name){return parent.node_ops.lookup(parent,name)},mknod(path,mode,dev){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);if(!name){throw new FS.ErrnoError(28)}if(name==="."||name===".."){throw new FS.ErrnoError(20)}var errCode=FS.mayCreate(parent,name);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.mknod){throw new FS.ErrnoError(63)}return parent.node_ops.mknod(parent,name,mode,dev)},statfs(path){return FS.statfsNode(FS.lookupPath(path,{follow:true}).node)},statfsStream(stream){return FS.statfsNode(stream.node)},statfsNode(node){var rtn={bsize:4096,frsize:4096,blocks:1e6,bfree:5e5,bavail:5e5,files:FS.nextInode,ffree:FS.nextInode-1,fsid:42,flags:2,namelen:255};if(node.node_ops.statfs){Object.assign(rtn,node.node_ops.statfs(node.mount.opts.root))}return rtn},create(path,mode=438){mode&=4095;mode|=32768;return FS.mknod(path,mode,0)},mkdir(path,mode=511){mode&=511|512;mode|=16384;return FS.mknod(path,mode,0)},mkdirTree(path,mode){var dirs=path.split("/");var d="";for(var dir of dirs){if(!dir)continue;if(d||PATH.isAbs(path))d+="/";d+=dir;try{FS.mkdir(d,mode)}catch(e){if(e.errno!=20)throw e}}},mkdev(path,mode,dev){if(typeof dev=="undefined"){dev=mode;mode=438}mode|=8192;return FS.mknod(path,mode,dev)},symlink(oldpath,newpath){if(!PATH_FS.resolve(oldpath)){throw new FS.ErrnoError(44)}var lookup=FS.lookupPath(newpath,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(44)}var newname=PATH.basename(newpath);var errCode=FS.mayCreate(parent,newname);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.symlink){throw new FS.ErrnoError(63)}return parent.node_ops.symlink(parent,newname,oldpath)},link(oldpath,newpath,flags){var lookup=FS.lookupPath(newpath,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(44)}var newname=PATH.basename(newpath);var errCode=FS.mayCreate(parent,newname);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.link){throw new FS.ErrnoError(34)}return parent.node_ops.link(parent,newname,oldpath,flags)},rename(old_path,new_path){var old_dirname=PATH.dirname(old_path);var new_dirname=PATH.dirname(new_path);var old_name=PATH.basename(old_path);var new_name=PATH.basename(new_path);var lookup,old_dir,new_dir;lookup=FS.lookupPath(old_path,{parent:true});old_dir=lookup.node;lookup=FS.lookupPath(new_path,{parent:true});new_dir=lookup.node;if(!old_dir||!new_dir)throw new FS.ErrnoError(44);if(old_dir.mount!==new_dir.mount){throw new FS.ErrnoError(75)}var old_node=FS.lookupNode(old_dir,old_name);var relative=PATH_FS.relative(old_path,new_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(28)}relative=PATH_FS.relative(new_path,old_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(55)}var new_node;try{new_node=FS.lookupNode(new_dir,new_name)}catch(e){}if(old_node===new_node){return}var isdir=FS.isDir(old_node.mode);var errCode=FS.mayDelete(old_dir,old_name,isdir);if(errCode){throw new FS.ErrnoError(errCode)}errCode=new_node?FS.mayDelete(new_dir,new_name,isdir):FS.mayCreate(new_dir,new_name);if(errCode){throw new FS.ErrnoError(errCode)}if(!old_dir.node_ops.rename){throw new FS.ErrnoError(63)}if(FS.isMountpoint(old_node)||new_node&&FS.isMountpoint(new_node)){throw new FS.ErrnoError(10)}if(new_dir!==old_dir){errCode=FS.nodePermissions(old_dir,"w");if(errCode){throw new FS.ErrnoError(errCode)}}FS.hashRemoveNode(old_node);try{old_dir.node_ops.rename(old_node,new_dir,new_name);old_node.parent=new_dir}catch(e){throw e}finally{FS.hashAddNode(old_node)}},rmdir(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,true);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.rmdir){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}parent.node_ops.rmdir(parent,name);FS.destroyNode(node)},readdir(path){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;var readdir=FS.checkOpExists(node.node_ops.readdir,54);return readdir(node)},unlink(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(44)}var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,false);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.unlink){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}parent.node_ops.unlink(parent,name);FS.destroyNode(node)},readlink(path){var lookup=FS.lookupPath(path);var link=lookup.node;if(!link){throw new FS.ErrnoError(44)}if(!link.node_ops.readlink){throw new FS.ErrnoError(28)}return link.node_ops.readlink(link)},stat(path,dontFollow){var lookup=FS.lookupPath(path,{follow:!dontFollow});var node=lookup.node;var getattr=FS.checkOpExists(node.node_ops.getattr,63);return getattr(node)},fstat(fd){var stream=FS.getStreamChecked(fd);var node=stream.node;var getattr=stream.stream_ops.getattr;var arg=getattr?stream:node;getattr??=node.node_ops.getattr;FS.checkOpExists(getattr,63);return getattr(arg)},lstat(path){return FS.stat(path,true)},doChmod(stream,node,mode,dontFollow){FS.doSetAttr(stream,node,{mode:mode&4095|node.mode&~4095,ctime:Date.now(),dontFollow})},chmod(path,mode,dontFollow){var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node}else{node=path}FS.doChmod(null,node,mode,dontFollow)},lchmod(path,mode){FS.chmod(path,mode,true)},fchmod(fd,mode){var stream=FS.getStreamChecked(fd);FS.doChmod(stream,stream.node,mode,false)},doChown(stream,node,dontFollow){FS.doSetAttr(stream,node,{timestamp:Date.now(),dontFollow})},chown(path,uid,gid,dontFollow){var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node}else{node=path}FS.doChown(null,node,dontFollow)},lchown(path,uid,gid){FS.chown(path,uid,gid,true)},fchown(fd,uid,gid){var stream=FS.getStreamChecked(fd);FS.doChown(stream,stream.node,false)},doTruncate(stream,node,len){if(FS.isDir(node.mode)){throw new FS.ErrnoError(31)}if(!FS.isFile(node.mode)){throw new FS.ErrnoError(28)}var errCode=FS.nodePermissions(node,"w");if(errCode){throw new FS.ErrnoError(errCode)}FS.doSetAttr(stream,node,{size:len,timestamp:Date.now()})},truncate(path,len){if(len<0){throw new FS.ErrnoError(28)}var node;if(typeof path=="string"){var lookup=FS.lookupPath(path,{follow:true});node=lookup.node}else{node=path}FS.doTruncate(null,node,len)},ftruncate(fd,len){var stream=FS.getStreamChecked(fd);if(len<0||(stream.flags&2097155)===0){throw new FS.ErrnoError(28)}FS.doTruncate(stream,stream.node,len)},utime(path,atime,mtime,dontFollow){var lookup=FS.lookupPath(path,{follow:!dontFollow});FS.doSetAttr(null,lookup.node,{atime,mtime,dontFollow})},open(path,flags,mode=438){if(path===""){throw new FS.ErrnoError(44)}flags=FS_modeStringToFlags(flags);if(flags&64){mode=mode&4095|32768}else{mode=0}var node;var isDirPath;if(typeof path=="object"){node=path}else{isDirPath=path.endsWith("/");var lookup=FS.lookupPath(path,{follow:!(flags&131072),noent_okay:true});node=lookup.node;path=lookup.path}var created=false;if(flags&64){if(node){if(flags&128){throw new FS.ErrnoError(20)}}else if(isDirPath){throw new FS.ErrnoError(31)}else{node=FS.mknod(path,mode|511,0);created=true}}if(!node){throw new FS.ErrnoError(44)}if(FS.isChrdev(node.mode)){flags&=~512}if(flags&65536&&!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}if(!created){var errCode=FS.mayOpen(node,flags);if(errCode){throw new FS.ErrnoError(errCode)}}if(flags&512&&!created){FS.truncate(node,0)}flags&=~(128|512|131072);var stream=FS.createStream({node,path:FS.getPath(node),flags,seekable:true,position:0,stream_ops:node.stream_ops,ungotten:[],error:false});if(stream.stream_ops.open){stream.stream_ops.open(stream)}if(created){FS.chmod(node,mode&511)}return stream},close(stream){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(stream.getdents)stream.getdents=null;stream.node?.notifyListeners(32);try{if(stream.stream_ops.close){stream.stream_ops.close(stream)}}catch(e){throw e}finally{FS.closeStream(stream.fd)}stream.fd=null},isClosed(stream){return stream.fd===null},llseek(stream,offset,whence){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(!stream.seekable||!stream.stream_ops.llseek){throw new FS.ErrnoError(70)}if(whence!=0&&whence!=1&&whence!=2){throw new FS.ErrnoError(28)}stream.position=stream.stream_ops.llseek(stream,offset,whence);stream.ungotten=[];return stream.position},read(stream,buffer,offset,length,position){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.read){throw new FS.ErrnoError(28)}var seeking=typeof position!="undefined";if(!seeking){position=stream.position}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesRead=stream.stream_ops.read(stream,buffer,offset,length,position);if(!seeking)stream.position+=bytesRead;return bytesRead},write(stream,buffer,offset,length,position,canOwn){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.write){throw new FS.ErrnoError(28)}if(stream.seekable&&stream.flags&1024){FS.llseek(stream,0,2)}var seeking=typeof position!="undefined";if(!seeking){position=stream.position}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesWritten=stream.stream_ops.write(stream,buffer,offset,length,position,canOwn);if(!seeking)stream.position+=bytesWritten;return bytesWritten},mmap(stream,length,position,prot,flags){if(prot&2&&!(flags&2)&&(stream.flags&2097155)!==2){throw new FS.ErrnoError(2)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(2)}if(!stream.stream_ops.mmap){throw new FS.ErrnoError(43)}if(!length){throw new FS.ErrnoError(28)}return stream.stream_ops.mmap(stream,length,position,prot,flags)},msync(stream,buffer,offset,length,mmapFlags){if(!stream.stream_ops.msync){return 0}return stream.stream_ops.msync(stream,buffer,offset,length,mmapFlags)},ioctl(stream,cmd,arg){if(!stream.stream_ops.ioctl){throw new FS.ErrnoError(59)}return stream.stream_ops.ioctl(stream,cmd,arg)},readFile(path,opts={}){opts.flags=opts.flags??0;opts.encoding=opts.encoding??"binary";if(opts.encoding!=="utf8"&&opts.encoding!=="binary"){abort(`Invalid encoding type "${opts.encoding}"`)}var stream=FS.open(path,opts.flags);var stat=FS.stat(path);var length=stat.size;var buf=new Uint8Array(length);FS.read(stream,buf,0,length,0);if(opts.encoding==="utf8"){buf=UTF8ArrayToString(buf)}FS.close(stream);return buf},writeFile(path,data,opts={}){opts.flags=opts.flags??577;var stream=FS.open(path,opts.flags,opts.mode);data=FS_fileDataToTypedArray(data);FS.write(stream,data,0,data.byteLength,undefined,opts.canOwn);FS.close(stream)},cwd:()=>FS.currentPath,chdir(path){var lookup=FS.lookupPath(path,{follow:true});if(lookup.node===null){throw new FS.ErrnoError(44)}if(!FS.isDir(lookup.node.mode)){throw new FS.ErrnoError(54)}var errCode=FS.nodePermissions(lookup.node,"x");if(errCode){throw new FS.ErrnoError(errCode)}FS.currentPath=lookup.path},createDefaultDirectories(){FS.mkdir("/tmp");FS.mkdir("/home");FS.mkdir("/home/web_user")},createDefaultDevices(){FS.mkdir("/dev");FS.registerDevice(FS.makedev(1,3),{read:()=>0,write:(stream,buffer,offset,length,pos)=>length,llseek:()=>0});FS.mkdev("/dev/null",FS.makedev(1,3));TTY.register(FS.makedev(5,0),TTY.default_tty_ops);TTY.register(FS.makedev(6,0),TTY.default_tty1_ops);FS.mkdev("/dev/tty",FS.makedev(5,0));FS.mkdev("/dev/tty1",FS.makedev(6,0));var randomBuffer=new Uint8Array(1024),randomLeft=0;var randomByte=()=>{if(!randomLeft){randomFill(randomBuffer);randomLeft=randomBuffer.byteLength}return randomBuffer[--randomLeft]};FS.createDevice("/dev","random",randomByte);FS.createDevice("/dev","urandom",randomByte);FS.mkdir("/dev/shm");FS.mkdir("/dev/shm/tmp")},createSpecialDirectories(){FS.mkdir("/proc");var proc_self=FS.mkdir("/proc/self");FS.mkdir("/proc/self/fd");FS.mount({mount(){var node=FS.createNode(proc_self,"fd",16895,73);node.stream_ops={llseek:MEMFS.stream_ops.llseek};node.node_ops={lookup(parent,name){var fd=+name;var stream=FS.getStreamChecked(fd);var ret={parent:null,mount:{mountpoint:"fake"},node_ops:{readlink:()=>stream.path},id:fd+1};ret.parent=ret;return ret},readdir(){return Array.from(FS.streams.entries()).filter(([k,v])=>v).map(([k,v])=>k.toString())}};return node}},{},"/proc/self/fd")},createStandardStreams(input,output,error){if(input){FS.createDevice("/dev","stdin",input)}else{FS.symlink("/dev/tty","/dev/stdin")}if(output){FS.createDevice("/dev","stdout",null,output)}else{FS.symlink("/dev/tty","/dev/stdout")}if(error){FS.createDevice("/dev","stderr",null,error)}else{FS.symlink("/dev/tty1","/dev/stderr")}var stdin=FS.open("/dev/stdin",0);var stdout=FS.open("/dev/stdout",1);var stderr=FS.open("/dev/stderr",1)},staticInit(){FS.nameTable=new Array(4096);FS.mount(MEMFS,{},"/");FS.createDefaultDirectories();FS.createDefaultDevices();FS.createSpecialDirectories();FS.filesystems={MEMFS}},init(input,output,error){FS.initialized=true;input??=Module["stdin"];output??=Module["stdout"];error??=Module["stderr"];FS.createStandardStreams(input,output,error)},quit(){FS.initialized=false;_fflush(0);for(var stream of FS.streams){if(stream){FS.close(stream)}}},findObject(path,dontResolveLastLink){var ret=FS.analyzePath(path,dontResolveLastLink);if(!ret.exists){return null}return ret.object},analyzePath(path,dontResolveLastLink){try{var lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});path=lookup.path}catch(e){}var ret={isRoot:false,exists:false,error:0,name:null,path:null,object:null,parentExists:false,parentPath:null,parentObject:null};try{var lookup=FS.lookupPath(path,{parent:true});ret.parentExists=true;ret.parentPath=lookup.path;ret.parentObject=lookup.node;ret.name=PATH.basename(path);lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});ret.exists=true;ret.path=lookup.path;ret.object=lookup.node;ret.name=lookup.node.name;ret.isRoot=lookup.path==="/"}catch(e){ret.error=e.errno}return ret},createPath(parent,path,canRead,canWrite){parent=typeof parent=="string"?parent:FS.getPath(parent);var parts=path.split("/").reverse();while(parts.length){var part=parts.pop();if(!part)continue;var current=PATH.join2(parent,part);try{FS.mkdir(current)}catch(e){if(e.errno!=20)throw e}parent=current}return current},createFile(parent,name,properties,canRead,canWrite){var path=PATH.join2(typeof parent=="string"?parent:FS.getPath(parent),name);var mode=FS_getMode(canRead,canWrite);return FS.create(path,mode)},createDataFile(parent,name,data,canRead,canWrite,canOwn){var path=name;if(parent){parent=typeof parent=="string"?parent:FS.getPath(parent);path=name?PATH.join2(parent,name):parent}var mode=FS_getMode(canRead,canWrite);var node=FS.create(path,mode);if(data){data=FS_fileDataToTypedArray(data);FS.chmod(node,mode|146);var stream=FS.open(node,577);FS.write(stream,data,0,data.length,0,canOwn);FS.close(stream);FS.chmod(node,mode)}},createDevice(parent,name,input,output){var path=PATH.join2(typeof parent=="string"?parent:FS.getPath(parent),name);var mode=FS_getMode(!!input,!!output);FS.createDevice.major??=64;var dev=FS.makedev(FS.createDevice.major++,0);FS.registerDevice(dev,{open(stream){stream.seekable=false},close(stream){if(output?.buffer?.length){output(10)}},read(stream,buffer,offset,length,pos){var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=input()}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&!bytesRead){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result}if(bytesRead){stream.node.atime=Date.now()}return bytesRead},write(stream,buffer,offset,length,pos){for(var i=0;i<length;i++){try{output(buffer[offset+i])}catch(e){throw new FS.ErrnoError(29)}}if(length){stream.node.mtime=stream.node.ctime=Date.now()}return i}});return FS.mkdev(path,mode,dev)},forceLoadFile(obj){if(obj.isDevice||obj.isFolder||obj.link||obj.contents)return true;if(globalThis.XMLHttpRequest){abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")}else{try{obj.contents=readBinary(obj.url)}catch(e){throw new FS.ErrnoError(29)}}},createLazyFile(parent,name,url,canRead,canWrite){class LazyUint8Array{lengthKnown=false;chunks=[];get(idx){if(idx>this.length-1||idx<0){return undefined}var chunkOffset=idx%this.chunkSize;var chunkNum=idx/this.chunkSize|0;return this.getter(chunkNum)[chunkOffset]}setDataGetter(getter){this.getter=getter}cacheLength(){var xhr=new XMLHttpRequest;xhr.open("HEAD",url,false);xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))abort(`Couldn't load ${url}. Status: ${xhr.status}`);var datalength=Number(xhr.getResponseHeader("Content-length"));var header;var hasByteServing=(header=xhr.getResponseHeader("Accept-Ranges"))&&header==="bytes";var usesGzip=(header=xhr.getResponseHeader("Content-Encoding"))&&header==="gzip";var chunkSize=1024*1024;if(!hasByteServing)chunkSize=datalength;var doXHR=(from,to)=>{if(from>to)abort(`invalid range (${from}, ${to}) or no bytes requested!`);if(to>datalength-1)abort(`only ${datalength} bytes available! programmer error!`);var xhr=new XMLHttpRequest;xhr.open("GET",url,false);if(datalength!==chunkSize)xhr.setRequestHeader("Range",`bytes=${from}-${to}`);xhr.responseType="arraybuffer";if(xhr.overrideMimeType){xhr.overrideMimeType("text/plain; charset=x-user-defined")}xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))abort(`Couldn't load ${url}. Status: ${xhr.status}`);if(xhr.response!==undefined){return new Uint8Array(xhr.response||[])}return intArrayFromString(xhr.responseText??"",true)};var lazyArray=this;lazyArray.setDataGetter(chunkNum=>{var start=chunkNum*chunkSize;var end=(chunkNum+1)*chunkSize-1;end=Math.min(end,datalength-1);if(typeof lazyArray.chunks[chunkNum]=="undefined"){lazyArray.chunks[chunkNum]=doXHR(start,end)}if(typeof lazyArray.chunks[chunkNum]=="undefined")abort("doXHR failed!");return lazyArray.chunks[chunkNum]});if(usesGzip||!datalength){chunkSize=datalength=1;datalength=this.getter(0).length;chunkSize=datalength;out("LazyFiles on gzip forces download of the whole file when length is accessed")}this._length=datalength;this._chunkSize=chunkSize;this.lengthKnown=true}get length(){if(!this.lengthKnown){this.cacheLength()}return this._length}get chunkSize(){if(!this.lengthKnown){this.cacheLength()}return this._chunkSize}}if(globalThis.XMLHttpRequest){if(!ENVIRONMENT_IS_WORKER)abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");var lazyArray=new LazyUint8Array;var properties={isDevice:false,contents:lazyArray}}else{var properties={isDevice:false,url}}var node=FS.createFile(parent,name,properties,canRead,canWrite);if(properties.contents){node.contents=properties.contents}else if(properties.url){node.contents=null;node.url=properties.url}Object.defineProperties(node,{usedBytes:{get:function(){return this.contents.length}}});var stream_ops={};for(const[key,fn]of Object.entries(node.stream_ops)){stream_ops[key]=(...args)=>{FS.forceLoadFile(node);return fn(...args)}}function writeChunks(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=contents.length)return 0;var size=Math.min(contents.length-position,length);if(contents.slice){for(var i=0;i<size;i++){buffer[offset+i]=contents[position+i]}}else{for(var i=0;i<size;i++){buffer[offset+i]=contents.get(position+i)}}return size}stream_ops.read=(stream,buffer,offset,length,position)=>{FS.forceLoadFile(node);return writeChunks(stream,buffer,offset,length,position)};stream_ops.mmap=(stream,length,position,prot,flags)=>{FS.forceLoadFile(node);var ptr=mmapAlloc(length);if(!ptr){throw new FS.ErrnoError(48)}writeChunks(stream,(growMemViews(),HEAP8),ptr,length,position);return{ptr,allocated:true}};node.stream_ops=stream_ops;return node}};var SOCKFS={callbacks:{},on(event,callback){SOCKFS.callbacks[event]=callback},emit(event,param){SOCKFS.callbacks[event]?.(param);var fd=event==="error"?param[0]:param;var flags={message:64|1,open:4,connection:64|1,close:1|16,error:8}[event];if(flags)FS.getStream(fd)?.node.notifyListeners(flags)},mount(mount){return FS.createNode(null,"/",16895,0)},createSocket(family,type,protocol){if(family!=2){throw new FS.ErrnoError(5)}var flags=2;type&=~526336;if(type!=1&&type!=2){throw new FS.ErrnoError(28)}var streaming=type==1;if(streaming&&protocol&&protocol!=6){throw new FS.ErrnoError(66)}var sock={family,type,protocol,server:null,error:null,peers:{},pending:[],recv_queue:[],sock_ops:SOCKFS.websocket_sock_ops};var name=SOCKFS.nextname();var node=FS.createNode(SOCKFS.root,name,49152,0);node.sock=sock;var stream=FS.createStream({path:name,node,flags,seekable:false,stream_ops:SOCKFS.stream_ops});sock.stream=stream;return sock},getSocket(fd){var stream=FS.getStream(fd);if(!stream||!FS.isSocket(stream.node.mode)){return null}return stream.node.sock},stream_ops:{getattr(stream){var node=stream.node;return{dev:1,ino:node.id,mode:49152|511,nlink:1,uid:0,gid:0,rdev:0,size:0,atime:new Date(0),mtime:new Date(0),ctime:new Date(0),blksize:4096,blocks:0}},poll(stream){var sock=stream.node.sock;return sock.sock_ops.poll(sock)},ioctl(stream,request,varargs){var sock=stream.node.sock;return sock.sock_ops.ioctl(sock,request,varargs)},read(stream,buffer,offset,length,position){var sock=stream.node.sock;var msg=sock.sock_ops.recvmsg(sock,length);if(!msg){return 0}buffer.set(msg.buffer,offset);return msg.buffer.length},write(stream,buffer,offset,length,position){var sock=stream.node.sock;return sock.sock_ops.sendmsg(sock,buffer,offset,length)},close(stream){var sock=stream.node.sock;sock.sock_ops.close(sock)}},nextname(){if(!SOCKFS.nextname.current){SOCKFS.nextname.current=0}return`socket[${SOCKFS.nextname.current++}]`},websocket_sock_ops:{createPeer(sock,addr,port){var ws;if(typeof addr=="object"){ws=addr;addr=null;port=null}if(ws){if(ws._socket){addr=ws._socket.remoteAddress;port=ws._socket.remotePort}else{var result=/ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);if(!result){throw new Error("WebSocket URL must be in the format ws(s)://address:port")}addr=result[1];port=parseInt(result[2],10)}}else{try{var url="ws://".replace("#","//");var subProtocols="binary";var opts=undefined;if(url==="ws://"||url==="wss://"){var parts=addr.split("/");url=url+parts[0]+":"+port+"/"+parts.slice(1).join("/")}if(subProtocols!=="null"){subProtocols=subProtocols.replace(/^ +| +$/g,"").split(/ *, */);opts=subProtocols}var WebSocketConstructor;{WebSocketConstructor=WebSocket}ws=new WebSocketConstructor(url,opts);ws.binaryType="arraybuffer"}catch(e){throw new FS.ErrnoError(23)}}var peer={addr,port,socket:ws,msg_send_queue:[]};SOCKFS.websocket_sock_ops.addPeer(sock,peer);SOCKFS.websocket_sock_ops.handlePeerEvents(sock,peer);if(sock.type===2&&typeof sock.sport!="undefined"){peer.msg_send_queue.push(new Uint8Array([255,255,255,255,"p".charCodeAt(0),"o".charCodeAt(0),"r".charCodeAt(0),"t".charCodeAt(0),(sock.sport&65280)>>8,sock.sport&255]))}return peer},getPeer(sock,addr,port){return sock.peers[addr+":"+port]},addPeer(sock,peer){sock.peers[peer.addr+":"+peer.port]=peer},removePeer(sock,peer){delete sock.peers[peer.addr+":"+peer.port]},handlePeerEvents(sock,peer){var first=true;function handleOpen(){sock.connecting=false;SOCKFS.emit("open",sock.stream.fd);try{var queued=peer.msg_send_queue.shift();while(queued){peer.socket.send(queued);queued=peer.msg_send_queue.shift()}}catch(e){peer.socket.close()}}function handleMessage(data){if(typeof data=="string"){var encoder=new TextEncoder;data=encoder.encode(data)}else{if(data.byteLength==0){return}data=new Uint8Array(data)}var wasfirst=first;first=false;if(wasfirst&&data.length===10&&data[0]===255&&data[1]===255&&data[2]===255&&data[3]===255&&data[4]==="p".charCodeAt(0)&&data[5]==="o".charCodeAt(0)&&data[6]==="r".charCodeAt(0)&&data[7]==="t".charCodeAt(0)){var newport=data[8]<<8|data[9];SOCKFS.websocket_sock_ops.removePeer(sock,peer);peer.port=newport;SOCKFS.websocket_sock_ops.addPeer(sock,peer);return}sock.recv_queue.push({addr:peer.addr,port:peer.port,data});SOCKFS.emit("message",sock.stream.fd)}peer.socket.onopen=handleOpen;peer.socket.onclose=()=>SOCKFS.emit("close",sock.stream.fd);peer.socket.onmessage=event=>handleMessage(event.data);peer.socket.onerror=error=>{sock.error=14;SOCKFS.emit("error",[sock.stream.fd,sock.error,"ECONNREFUSED: Connection refused"])}},poll(sock){if(sock.type===1&&sock.server){return sock.pending.length?64|1:0}var mask=0;var dest=sock.type===1?SOCKFS.websocket_sock_ops.getPeer(sock,sock.daddr,sock.dport):null;if(sock.recv_queue.length||!dest||dest&&dest.socket.readyState===dest.socket.CLOSING||dest&&dest.socket.readyState===dest.socket.CLOSED){mask|=64|1}if(!dest||dest&&dest.socket.readyState===dest.socket.OPEN){mask|=4}if(dest&&dest.socket.readyState===dest.socket.CLOSING||dest&&dest.socket.readyState===dest.socket.CLOSED){if(sock.connecting){mask|=4}else{mask|=16|8192}}return mask},ioctl(sock,request,arg){switch(request){case 21531:var bytes=0;if(sock.recv_queue.length){bytes=sock.recv_queue[0].data.length}(growMemViews(),HEAP32)[arg/4]=bytes;return 0;case 21537:var on=(growMemViews(),HEAP32)[arg/4];if(on){sock.stream.flags|=2048}else{sock.stream.flags&=~2048}return 0;default:return 28}},close(sock){if(sock.server){try{sock.server.close()}catch(e){}sock.server=null}for(var peer of Object.values(sock.peers)){try{peer.socket.close()}catch(e){}SOCKFS.websocket_sock_ops.removePeer(sock,peer)}return 0},bind(sock,addr,port){if(typeof sock.saddr!="undefined"||typeof sock.sport!="undefined"){throw new FS.ErrnoError(28)}sock.saddr=addr;sock.sport=port;if(sock.type===2){if(sock.server){sock.server.close();sock.server=null}try{sock.sock_ops.listen(sock,0)}catch(e){if(!(e.name==="ErrnoError"))throw e;if(e.errno!==138)throw e}}},connect(sock,addr,port){if(sock.server){throw new FS.ErrnoError(138)}if(typeof sock.daddr!="undefined"&&typeof sock.dport!="undefined"){var dest=SOCKFS.websocket_sock_ops.getPeer(sock,sock.daddr,sock.dport);if(dest){if(dest.socket.readyState===dest.socket.CONNECTING){throw new FS.ErrnoError(7)}else{throw new FS.ErrnoError(30)}}}var peer=SOCKFS.websocket_sock_ops.createPeer(sock,addr,port);sock.daddr=peer.addr;sock.dport=peer.port;sock.connecting=true},listen(sock,backlog){if(!ENVIRONMENT_IS_NODE){throw new FS.ErrnoError(138)}},accept(listensock){if(!listensock.server||!listensock.pending.length){throw new FS.ErrnoError(28)}var newsock=listensock.pending.shift();newsock.stream.flags=listensock.stream.flags;return newsock},getname(sock,peer){var addr,port;if(peer){if(sock.daddr===undefined||sock.dport===undefined){throw new FS.ErrnoError(53)}addr=sock.daddr;port=sock.dport}else{addr=sock.saddr||0;port=sock.sport||0}return{addr,port}},sendmsg(sock,buffer,offset,length,addr,port){if(sock.type===2){if(addr===undefined||port===undefined){addr=sock.daddr;port=sock.dport}if(addr===undefined||port===undefined){throw new FS.ErrnoError(17)}}else{addr=sock.daddr;port=sock.dport}var dest=SOCKFS.websocket_sock_ops.getPeer(sock,addr,port);if(sock.type===1){if(!dest||dest.socket.readyState===dest.socket.CLOSING||dest.socket.readyState===dest.socket.CLOSED){throw new FS.ErrnoError(53)}}if(ArrayBuffer.isView(buffer)){offset+=buffer.byteOffset;buffer=buffer.buffer}var data=buffer.slice(offset,offset+length);if(data instanceof SharedArrayBuffer){data=new Uint8Array(new Uint8Array(data)).buffer}if(!dest||dest.socket.readyState!==dest.socket.OPEN){if(sock.type===2){if(!dest||dest.socket.readyState===dest.socket.CLOSING||dest.socket.readyState===dest.socket.CLOSED){dest=SOCKFS.websocket_sock_ops.createPeer(sock,addr,port)}}dest.msg_send_queue.push(data);return length}try{dest.socket.send(data);return length}catch(e){throw new FS.ErrnoError(28)}},recvmsg(sock,length,flags){if(sock.type===1&&sock.server){throw new FS.ErrnoError(53)}var peek=flags&2;var queued=sock.recv_queue[0];if(!queued){if(sock.type===1){var dest=SOCKFS.websocket_sock_ops.getPeer(sock,sock.daddr,sock.dport);if(!dest){throw new FS.ErrnoError(53)}if(dest.socket.readyState===dest.socket.CLOSING||dest.socket.readyState===dest.socket.CLOSED){return null}throw new FS.ErrnoError(6)}throw new FS.ErrnoError(6)}var queuedLength=queued.data.byteLength||queued.data.length;var queuedOffset=queued.data.byteOffset||0;var queuedBuffer=queued.data.buffer||queued.data;var bytesRead=Math.min(length,queuedLength);var res={buffer:new Uint8Array(queuedBuffer,queuedOffset,bytesRead),addr:queued.addr,port:queued.port};if(peek)return res;sock.recv_queue.shift();if(sock.type===1&&bytesRead<queuedLength){var bytesRemaining=queuedLength-bytesRead;queued.data=new Uint8Array(queuedBuffer,queuedOffset+bytesRead,bytesRemaining);sock.recv_queue.unshift(queued)}return res}}};var getSocketFromFD=fd=>{var socket=SOCKFS.getSocket(fd);if(!socket)throw new FS.ErrnoError(8);return socket};var inetPton4=str=>{var b=str.split(".");for(var i=0;i<4;i++){var tmp=Number(b[i]);if(isNaN(tmp))return null;b[i]=tmp}return(b[0]|b[1]<<8|b[2]<<16|b[3]<<24)>>>0};var inetPton6=str=>{var words;var w,offset,z;var valid6regx=/^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;var parts=[];if(!valid6regx.test(str)){return null}if(str==="::"){return[0,0,0,0,0,0,0,0]}if(str.startsWith("::")){str=str.replace("::","Z:")}else{str=str.replace("::",":Z:")}if(str.indexOf(".")>0){str=str.replace(new RegExp("[.]","g"),":");words=str.split(":");words[words.length-4]=Number(words[words.length-4])+Number(words[words.length-3])*256;words[words.length-3]=Number(words[words.length-2])+Number(words[words.length-1])*256;words=words.slice(0,words.length-2)}else{words=str.split(":")}offset=0;z=0;for(w=0;w<words.length;w++){if(typeof words[w]=="string"){if(words[w]==="Z"){for(z=0;z<8-words.length+1;z++){parts[w+z]=0}offset=z-1}else{parts[w+offset]=_htons(parseInt(words[w],16))}}else{parts[w+offset]=words[w]}}return[parts[1]<<16|parts[0],parts[3]<<16|parts[2],parts[5]<<16|parts[4],parts[7]<<16|parts[6]]};var HEAPU8;var zeroMemory=(ptr,size)=>(growMemViews(),HEAPU8).fill(0,ptr,ptr+size);var DNS={address_map:{id:1,addrs:{},names:{}},lookup_name(name){var res=inetPton4(name);if(res!==null){return name}res=inetPton6(name);if(res!==null){return name}var addr;if(DNS.address_map.addrs[name]){addr=DNS.address_map.addrs[name]}else{var id=DNS.address_map.id++;addr="172.29."+(id&255)+"."+(id&65280);DNS.address_map.names[addr]=name;DNS.address_map.addrs[name]=addr}return addr},lookup_addr(addr){if(DNS.address_map.names[addr]){return DNS.address_map.names[addr]}return null}};var HEAP16;var writeSockaddr=(sa,family,addr,port,addrlen)=>{switch(family){case 2:addr=inetPton4(DNS.lookup_name(addr));zeroMemory(sa,16);if(addrlen){(growMemViews(),HEAP32)[addrlen/4]=16}(growMemViews(),HEAP16)[sa/2]=family;(growMemViews(),HEAP32)[(sa+4)/4]=addr;(growMemViews(),HEAP16)[(sa+2)/2]=_htons(port);break;case 10:addr=inetPton6(DNS.lookup_name(addr));zeroMemory(sa,28);if(addrlen){(growMemViews(),HEAP32)[addrlen/4]=28}(growMemViews(),HEAP32)[sa/4]=family;(growMemViews(),HEAP32)[(sa+8)/4]=addr[0];(growMemViews(),HEAP32)[(sa+12)/4]=addr[1];(growMemViews(),HEAP32)[(sa+16)/4]=addr[2];(growMemViews(),HEAP32)[(sa+20)/4]=addr[3];(growMemViews(),HEAP16)[(sa+2)/2]=_htons(port);break;default:return 5}return 0};function ___syscall_accept4(fd,addr,len,flags,u1,u2){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(3,0,1,fd,addr,len,flags,u1,u2);addr=bigintToI53Checked(addr);len=bigintToI53Checked(len);try{var sock=getSocketFromFD(fd);var newsock=sock.sock_ops.accept(sock);if(addr){var errno=writeSockaddr(addr,newsock.family,newsock.daddr,newsock.dport,len)}return newsock.stream.fd}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var inetNtop4=addr=>(addr&255)+"."+(addr>>8&255)+"."+(addr>>16&255)+"."+(addr>>24&255);var inetNtop6=ints=>{var str="";var word=0;var longest=0;var lastzero=0;var zstart=0;var len=0;var i=0;var parts=[ints[0]&65535,ints[0]>>16,ints[1]&65535,ints[1]>>16,ints[2]&65535,ints[2]>>16,ints[3]&65535,ints[3]>>16];var hasipv4=true;var v4part="";for(i=0;i<5;i++){if(parts[i]){hasipv4=false;break}}if(hasipv4){v4part=inetNtop4(parts[6]|parts[7]<<16);if(parts[5]===-1){str="::ffff:";str+=v4part;return str}if(!parts[5]){str="::";if(v4part==="0.0.0.0")v4part="";if(v4part==="0.0.0.1")v4part="1";str+=v4part;return str}}for(word=0;word<8;word++){if(!parts[word]){if(word-lastzero>1){len=0}lastzero=word;len++}if(len>longest){longest=len;zstart=word-longest+1}}for(word=0;word<8;word++){if(longest>1){if(!parts[word]&&word>=zstart&&word<zstart+longest){if(word===zstart){str+=":";if(!zstart)str+=":"}continue}}str+=Number(_ntohs(parts[word]&65535)).toString(16);str+=word<7?":":""}return str};var HEAPU16;var readSockaddr=(sa,salen)=>{var family=(growMemViews(),HEAP16)[sa/2];var port=_ntohs((growMemViews(),HEAPU16)[(sa+2)/2]);var addr;switch(family){case 2:if(salen!==16){return{errno:28}}addr=(growMemViews(),HEAP32)[(sa+4)/4];addr=inetNtop4(addr);break;case 10:if(salen!==28){return{errno:28}}addr=[(growMemViews(),HEAP32)[(sa+8)/4],(growMemViews(),HEAP32)[(sa+12)/4],(growMemViews(),HEAP32)[(sa+16)/4],(growMemViews(),HEAP32)[(sa+20)/4]];addr=inetNtop6(addr);break;default:return{errno:5}}return{family,addr,port}};var getSocketAddress=(addrp,addrlen)=>{var info=readSockaddr(addrp,addrlen);if(info.errno)throw new FS.ErrnoError(info.errno);info.addr=DNS.lookup_addr(info.addr)||info.addr;return info};function ___syscall_bind(fd,addr,len,u1,u2,u3){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(4,0,1,fd,addr,len,u1,u2,u3);addr=bigintToI53Checked(addr);try{var sock=getSocketFromFD(fd);var info=getSocketAddress(addr,len);sock.sock_ops.bind(sock,info.addr,info.port);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_connect(fd,addr,len,u1,u2,u3){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(5,0,1,fd,addr,len,u1,u2,u3);addr=bigintToI53Checked(addr);try{var sock=getSocketFromFD(fd);var info=getSocketAddress(addr,len);sock.sock_ops.connect(sock,info.addr,info.port);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var syscallGetVarargP=()=>{var ret=Number((growMemViews(),HEAPU64)[SYSCALLS.varargs/8]);SYSCALLS.varargs+=8;return ret};var syscallGetVarargI=()=>{var ret=(growMemViews(),HEAP32)[+SYSCALLS.varargs/4];SYSCALLS.varargs+=4;return ret};var UTF8ToString=(ptr,maxBytesToRead,ignoreNul)=>ptr?UTF8ArrayToString((growMemViews(),HEAPU8),ptr,maxBytesToRead,ignoreNul):"";var HEAPU32;var SYSCALLS={currentUmask:18,calculateAt(dirfd,path,allowEmpty){if(PATH.isAbs(path)){return path}var dir;if(dirfd===-100){dir=FS.cwd()}else{var dirstream=SYSCALLS.getStreamFromFD(dirfd);dir=dirstream.path}if(path.length==0){if(!allowEmpty){throw new FS.ErrnoError(44)}return dir}return dir+"/"+path},writeStat(buf,stat){(growMemViews(),HEAPU32)[buf/4]=stat.dev;(growMemViews(),HEAPU32)[(buf+4)/4]=stat.mode;(growMemViews(),HEAPU64)[(buf+8)/8]=BigInt(stat.nlink);(growMemViews(),HEAPU32)[(buf+16)/4]=stat.uid;(growMemViews(),HEAPU32)[(buf+20)/4]=stat.gid;(growMemViews(),HEAPU32)[(buf+24)/4]=stat.rdev;(growMemViews(),HEAP64)[(buf+32)/8]=BigInt(stat.size);(growMemViews(),HEAP32)[(buf+40)/4]=4096;(growMemViews(),HEAP32)[(buf+44)/4]=stat.blocks;var atime=stat.atime.getTime();var mtime=stat.mtime.getTime();var ctime=stat.ctime.getTime();(growMemViews(),HEAP64)[(buf+48)/8]=BigInt(Math.floor(atime/1e3));(growMemViews(),HEAPU64)[(buf+56)/8]=BigInt(atime%1e3*1e3*1e3);(growMemViews(),HEAP64)[(buf+64)/8]=BigInt(Math.floor(mtime/1e3));(growMemViews(),HEAPU64)[(buf+72)/8]=BigInt(mtime%1e3*1e3*1e3);(growMemViews(),HEAP64)[(buf+80)/8]=BigInt(Math.floor(ctime/1e3));(growMemViews(),HEAPU64)[(buf+88)/8]=BigInt(ctime%1e3*1e3*1e3);(growMemViews(),HEAP64)[(buf+96)/8]=BigInt(stat.ino);return 0},writeStatFs(buf,stats){(growMemViews(),HEAPU32)[(buf+8)/4]=stats.bsize;(growMemViews(),HEAPU32)[(buf+72)/4]=stats.bsize;(growMemViews(),HEAP64)[(buf+16)/8]=BigInt(stats.blocks);(growMemViews(),HEAP64)[(buf+24)/8]=BigInt(stats.bfree);(growMemViews(),HEAP64)[(buf+32)/8]=BigInt(stats.bavail);(growMemViews(),HEAP64)[(buf+40)/8]=BigInt(stats.files);(growMemViews(),HEAP64)[(buf+48)/8]=BigInt(stats.ffree);(growMemViews(),HEAPU32)[(buf+56)/4]=stats.fsid;(growMemViews(),HEAPU32)[(buf+80)/4]=stats.flags;(growMemViews(),HEAPU32)[(buf+64)/4]=stats.namelen},doMsync(addr,stream,len,flags,offset){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}if(flags&2){return 0}var buffer=(growMemViews(),HEAPU8).subarray(addr,addr+len);FS.msync(stream,buffer,offset,len,flags)},getStreamFromFD(fd){var stream=FS.getStreamChecked(fd);return stream},varargs:undefined,getStr(ptr){var ret=UTF8ToString(ptr);return ret}};function ___syscall_fcntl64(fd,cmd,varargs){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(6,0,1,fd,cmd,varargs);varargs=bigintToI53Checked(varargs);SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(fd);switch(cmd){case 0:{var arg=syscallGetVarargI();if(arg<0){return-28}while(FS.streams[arg]){arg++}var newStream;newStream=FS.dupStream(stream,arg);return newStream.fd}case 1:case 2:return 0;case 3:return stream.flags;case 4:{var arg=syscallGetVarargI();var mask=289792;stream.flags=stream.flags&~mask|arg&mask;return 0}case 5:{var arg=syscallGetVarargP();var offset=0;(growMemViews(),HEAP16)[(arg+offset)/2]=2;return 0}case 6:case 7:return 0}return-28}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_fstat64(fd,buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(7,0,1,fd,buf);buf=bigintToI53Checked(buf);try{return SYSCALLS.writeStat(buf,FS.fstat(fd))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_ftruncate64(fd,length){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(8,0,1,fd,length);length=bigintToI53Checked(length);try{if(isNaN(length))return-22;FS.ftruncate(fd,length);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var stringToUTF8=(str,outPtr,maxBytesToWrite)=>stringToUTF8Array(str,(growMemViews(),HEAPU8),outPtr,maxBytesToWrite);function ___syscall_getcwd(buf,size){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(9,0,1,buf,size);buf=bigintToI53Checked(buf);size=bigintToI53Checked(size);try{if(!size)return-28;var cwd=FS.cwd();var cwdLengthInBytes=lengthBytesUTF8(cwd)+1;if(size<cwdLengthInBytes)return-68;stringToUTF8(cwd,buf,size);return cwdLengthInBytes}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_getdents64(fd,dirp,count){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(10,0,1,fd,dirp,count);dirp=bigintToI53Checked(dirp);count=bigintToI53Checked(count);try{var stream=SYSCALLS.getStreamFromFD(fd);stream.getdents||=FS.readdir(stream.path);var struct_size=280;var pos=0;var off=FS.llseek(stream,0,1);var startIdx=Math.floor(off/struct_size);var endIdx=Math.min(stream.getdents.length,startIdx+Math.floor(count/struct_size));for(var idx=startIdx;idx<endIdx;idx++){var id;var type;var name=stream.getdents[idx];if(name==="."){id=stream.node.id;type=4}else if(name===".."){var lookup=FS.lookupPath(stream.path,{parent:true});id=lookup.node.id;type=4}else{var child;try{child=FS.lookupNode(stream.node,name)}catch(e){if(e?.errno===28){continue}throw e}id=child.id;type=FS.isChrdev(child.mode)?2:FS.isDir(child.mode)?4:FS.isLink(child.mode)?10:8}(growMemViews(),HEAP64)[(dirp+pos)/8]=BigInt(id);(growMemViews(),HEAP64)[(dirp+pos+8)/8]=BigInt((idx+1)*struct_size);(growMemViews(),HEAP16)[(dirp+pos+16)/2]=280;(growMemViews(),HEAP8)[dirp+pos+18]=type;stringToUTF8(name,dirp+pos+19,256);pos+=struct_size}FS.llseek(stream,idx*struct_size,0);return pos}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_getsockname(fd,addr,len,u1,u2,u3){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(11,0,1,fd,addr,len,u1,u2,u3);addr=bigintToI53Checked(addr);len=bigintToI53Checked(len);try{var sock=getSocketFromFD(fd);var defaultAddr="0.0.0.0";var errno=writeSockaddr(addr,sock.family,sock.saddr||defaultAddr,sock.sport,len);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_getsockopt(fd,level,optname,optval,optlen,unused){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(12,0,1,fd,level,optname,optval,optlen,unused);optval=bigintToI53Checked(optval);optlen=bigintToI53Checked(optlen);try{var sock=getSocketFromFD(fd);if(level===1){if(optname===4){(growMemViews(),HEAP32)[optval/4]=sock.error;(growMemViews(),HEAP32)[optlen/4]=4;sock.error=null;return 0}}return-50}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_ioctl(fd,op,varargs){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(13,0,1,fd,op,varargs);varargs=bigintToI53Checked(varargs);SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(fd);switch(op){case 21509:{if(!stream.tty)return-59;return 0}case 21505:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tcgets){var termios=stream.tty.ops.ioctl_tcgets(stream);var argp=syscallGetVarargP();(growMemViews(),HEAP32)[argp/4]=termios.c_iflag||0;(growMemViews(),HEAP32)[(argp+4)/4]=termios.c_oflag||0;(growMemViews(),HEAP32)[(argp+8)/4]=termios.c_cflag||0;(growMemViews(),HEAP32)[(argp+12)/4]=termios.c_lflag||0;for(var i=0;i<32;i++){(growMemViews(),HEAP8)[argp+i+17]=termios.c_cc[i]||0}return 0}return 0}case 21510:case 21511:case 21512:{if(!stream.tty)return-59;return 0}case 21506:case 21507:case 21508:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tcsets){var argp=syscallGetVarargP();var c_iflag=(growMemViews(),HEAP32)[argp/4];var c_oflag=(growMemViews(),HEAP32)[(argp+4)/4];var c_cflag=(growMemViews(),HEAP32)[(argp+8)/4];var c_lflag=(growMemViews(),HEAP32)[(argp+12)/4];var c_cc=[];for(var i=0;i<32;i++){c_cc.push((growMemViews(),HEAP8)[argp+i+17])}return stream.tty.ops.ioctl_tcsets(stream.tty,op,{c_iflag,c_oflag,c_cflag,c_lflag,c_cc})}return 0}case 21519:{if(!stream.tty)return-59;var argp=syscallGetVarargP();(growMemViews(),HEAP32)[argp/4]=0;return 0}case 21520:{if(!stream.tty)return-59;return-28}case 21537:case 21531:{var argp=syscallGetVarargP();return FS.ioctl(stream,op,argp)}case 21523:{if(!stream.tty)return-59;if(stream.tty.ops.ioctl_tiocgwinsz){var winsize=stream.tty.ops.ioctl_tiocgwinsz(stream.tty);var argp=syscallGetVarargP();(growMemViews(),HEAP16)[argp/2]=winsize[0];(growMemViews(),HEAP16)[(argp+2)/2]=winsize[1]}return 0}case 21524:{if(!stream.tty)return-59;return 0}case 21515:{if(!stream.tty)return-59;return 0}default:return-28}}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_listen(fd,backlog,u1,u2,u3,u4){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(14,0,1,fd,backlog,u1,u2,u3,u4);try{var sock=getSocketFromFD(fd);sock.sock_ops.listen(sock,backlog);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_lstat64(path,buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(15,0,1,path,buf);path=bigintToI53Checked(path);buf=bigintToI53Checked(buf);try{path=SYSCALLS.getStr(path);return SYSCALLS.writeStat(buf,FS.lstat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_mkdirat(dirfd,path,mode){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(16,0,1,dirfd,path,mode);path=bigintToI53Checked(path);try{path=SYSCALLS.getStr(path);path=SYSCALLS.calculateAt(dirfd,path);mode&=~SYSCALLS.currentUmask;FS.mkdir(path,mode,0);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_newfstatat(dirfd,path,buf,flags){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(17,0,1,dirfd,path,buf,flags);path=bigintToI53Checked(path);buf=bigintToI53Checked(buf);try{path=SYSCALLS.getStr(path);var nofollow=flags&256;var allowEmpty=flags&4096;flags=flags&~6400;path=SYSCALLS.calculateAt(dirfd,path,allowEmpty);return SYSCALLS.writeStat(buf,nofollow?FS.lstat(path):FS.stat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_openat(dirfd,path,flags,varargs){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(18,0,1,dirfd,path,flags,varargs);path=bigintToI53Checked(path);varargs=bigintToI53Checked(varargs);SYSCALLS.varargs=varargs;try{path=SYSCALLS.getStr(path);path=SYSCALLS.calculateAt(dirfd,path);var mode=varargs?syscallGetVarargI():0;if(flags&64){mode&=~SYSCALLS.currentUmask}return FS.open(path,flags,mode).fd}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var pollOne=(fd,events)=>{var stream=FS.getStream(fd);if(!stream)return 32;var flags=stream.stream_ops?.poll?.(stream)??5;return flags&(events|8|16|32)};var doPollSync=(fds,nfds)=>{var count=0;for(var i=0,pollfd=fds;i<nfds;i++,pollfd+=8){var revents=pollOne((growMemViews(),HEAP32)[pollfd/4],(growMemViews(),HEAP16)[(pollfd+4)/2]);if(revents)count++;(growMemViews(),HEAP16)[(pollfd+6)/2]=revents}return count};var doPollAsync=(fds,nfds,timeout)=>new Promise(resolve=>{var regs=[];var timer;var done=false;function derive(){var count=0;for(var i=0,pollfd=fds;i<nfds;i++,pollfd+=8){var revents=pollOne((growMemViews(),HEAP32)[pollfd/4],(growMemViews(),HEAP16)[(pollfd+4)/2]);if(revents)count++;(growMemViews(),HEAP16)[(pollfd+6)/2]=revents}return count}function finish(count){if(done)return;done=true;for(var r of regs)r.listeners.delete(r.entry);if(timer)clearTimeout(timer);resolve(count)}var count=derive();if(count||!timeout){finish(count)}else{function recheck(){if(done)return;var c=derive();if(c)finish(c)}for(var i=0,pollfd=fds;i<nfds;i++,pollfd+=8){var stream=FS.getStream((growMemViews(),HEAP32)[pollfd/4]);if(stream)regs.push(stream.node.addListener(recheck))}if(timeout>0)timer=setTimeout(()=>finish(0),timeout)}});function ___syscall_poll(fds,nfds,timeout){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(19,0,2,fds,nfds,timeout);fds=bigintToI53Checked(fds);try{const isAsyncContext=PThread.currentProxiedOperationCallerThread;if(isAsyncContext){return doPollAsync(fds,nfds,timeout)}var count=doPollSync(fds,nfds);return count}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_recvfrom(fd,buf,len,flags,addr,alen){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(20,0,1,fd,buf,len,flags,addr,alen);buf=bigintToI53Checked(buf);len=bigintToI53Checked(len);addr=bigintToI53Checked(addr);alen=bigintToI53Checked(alen);try{var sock=getSocketFromFD(fd);var msg=sock.sock_ops.recvmsg(sock,len,flags);if(!msg)return 0;if(addr){var errno=writeSockaddr(addr,sock.family,msg.addr,msg.port,alen)}(growMemViews(),HEAPU8).set(msg.buffer,buf);return msg.buffer.byteLength}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_renameat(olddirfd,oldpath,newdirfd,newpath){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(21,0,1,olddirfd,oldpath,newdirfd,newpath);oldpath=bigintToI53Checked(oldpath);newpath=bigintToI53Checked(newpath);try{oldpath=SYSCALLS.getStr(oldpath);newpath=SYSCALLS.getStr(newpath);oldpath=SYSCALLS.calculateAt(olddirfd,oldpath);newpath=SYSCALLS.calculateAt(newdirfd,newpath);FS.rename(oldpath,newpath);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_rmdir(path){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(22,0,1,path);path=bigintToI53Checked(path);try{path=SYSCALLS.getStr(path);FS.rmdir(path);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_sendto(fd,buf,len,flags,addr,alen){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(23,0,1,fd,buf,len,flags,addr,alen);buf=bigintToI53Checked(buf);len=bigintToI53Checked(len);addr=bigintToI53Checked(addr);try{var sock=getSocketFromFD(fd);if(!addr){return FS.write(sock.stream,(growMemViews(),HEAP8),buf,len)}var dest=getSocketAddress(addr,alen);return sock.sock_ops.sendmsg(sock,(growMemViews(),HEAP8),buf,len,dest.addr,dest.port)}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_setsockopt(fd,level,optname,optval,optlen,unused){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(24,0,1,fd,level,optname,optval,optlen,unused);optval=bigintToI53Checked(optval);try{getSocketFromFD(fd);return-50}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_shutdown(fd,how,u1,u2,u3,u4){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(25,0,1,fd,how,u1,u2,u3,u4);try{var sock=getSocketFromFD(fd);return-52}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_socket(domain,type,protocol,u1,u2,u3){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(26,0,1,domain,type,protocol,u1,u2,u3);try{var sock=SOCKFS.createSocket(domain,type,protocol);return sock.stream.fd}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_stat64(path,buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(27,0,1,path,buf);path=bigintToI53Checked(path);buf=bigintToI53Checked(buf);try{path=SYSCALLS.getStr(path);return SYSCALLS.writeStat(buf,FS.stat(path))}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_statfs64(path,size,buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(28,0,1,path,size,buf);path=bigintToI53Checked(path);size=bigintToI53Checked(size);buf=bigintToI53Checked(buf);try{SYSCALLS.writeStatFs(buf,FS.statfs(SYSCALLS.getStr(path)));return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}function ___syscall_unlinkat(dirfd,path,flags){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(29,0,1,dirfd,path,flags);path=bigintToI53Checked(path);try{path=SYSCALLS.getStr(path);path=SYSCALLS.calculateAt(dirfd,path);if(!flags){FS.unlink(path)}else if(flags===512){FS.rmdir(path)}else{return-28}return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return-e.errno}}var __abort_js=()=>abort("");function __emscripten_init_main_thread_js(tb){tb=bigintToI53Checked(tb);var can_block=!ENVIRONMENT_IS_WEB;__emscripten_thread_init(tb,!ENVIRONMENT_IS_WORKER,1,can_block,1048576,false);PThread.threadInitTLS()}var handleException=e=>{if(e instanceof ExitStatus||e=="unwind"){return EXITSTATUS}quit_(1,e)};var maybeExit=()=>{if(runtimeExited){return}if(!keepRuntimeAlive()){try{if(ENVIRONMENT_IS_PTHREAD){if(_pthread_self())__emscripten_thread_exit(EXITSTATUS);return}_exit(EXITSTATUS)}catch(e){handleException(e)}}};var callUserCallback=func=>{if(runtimeExited||ABORT){return}try{return func()}catch(e){handleException(e)}finally{maybeExit()}};function __emscripten_thread_mailbox_await(pthread_ptr){pthread_ptr=bigintToI53Checked(pthread_ptr);if(!waitAsyncPolyfilled){var wait=Atomics.waitAsync((growMemViews(),HEAP32),pthread_ptr/4,pthread_ptr);wait.value.then(checkMailbox);var waitingAsync=pthread_ptr+204;Atomics.store((growMemViews(),HEAP32),waitingAsync/4,1)}}var checkMailbox=()=>{var pthread_ptr=_pthread_self();if(!pthread_ptr)return;callUserCallback(()=>{__emscripten_thread_mailbox_await(pthread_ptr);__emscripten_check_mailbox()})};function __emscripten_notify_mailbox_postmessage(targetThread,currThreadId){targetThread=bigintToI53Checked(targetThread);currThreadId=bigintToI53Checked(currThreadId);if(targetThread==currThreadId){setTimeout(checkMailbox)}else if(ENVIRONMENT_IS_PTHREAD){postMessage({targetThread,cmd:4})}else{var worker=PThread.pthreads[targetThread];if(!worker){return}worker.postMessage({cmd:4})}}var proxiedJSCallArgs=[];function __emscripten_receive_on_main_thread_js(funcIndex,emAsmAddr,callingThread,bufSize,args,ctx,ctxArgs){emAsmAddr=bigintToI53Checked(emAsmAddr);callingThread=bigintToI53Checked(callingThread);args=bigintToI53Checked(args);ctx=bigintToI53Checked(ctx);ctxArgs=bigintToI53Checked(ctxArgs);proxiedJSCallArgs.length=0;var b=args/8;var end=(args+bufSize)/8;while(b<end){var arg;if((growMemViews(),HEAP64)[b++]){arg=(growMemViews(),HEAP64)[b++]}else{arg=(growMemViews(),HEAPF64)[b++]}proxiedJSCallArgs.push(arg)}var func=emAsmAddr?ASM_CONSTS[emAsmAddr]:proxiedFunctionTable[funcIndex];PThread.currentProxiedOperationCallerThread=callingThread;var rtn=func(...proxiedJSCallArgs);PThread.currentProxiedOperationCallerThread=0;if(ctx){Promise.resolve(rtn).then(rtn=>__emscripten_run_js_on_main_thread_done(ctx,ctxArgs,rtn));return}if(typeof rtn=="bigint"){rtn=bigintToI53Checked(rtn)}return rtn}function __emscripten_system(command){command=bigintToI53Checked(command);if(!command)return 0;return-52}function __emscripten_thread_cleanup(thread){thread=bigintToI53Checked(thread);if(!ENVIRONMENT_IS_PTHREAD)cleanupThread(thread);else postMessage({cmd:6,thread})}function __emscripten_thread_set_strongref(thread){thread=bigintToI53Checked(thread)}var __emscripten_throw_longjmp=()=>{throw new EmscriptenSjLj};function __gmtime_js(time,tmPtr){time=bigintToI53Checked(time);tmPtr=bigintToI53Checked(tmPtr);var date=new Date(time*1e3);if(isNaN(date.getTime())){return 1}(growMemViews(),HEAP32)[tmPtr/4]=date.getUTCSeconds();(growMemViews(),HEAP32)[(tmPtr+4)/4]=date.getUTCMinutes();(growMemViews(),HEAP32)[(tmPtr+8)/4]=date.getUTCHours();(growMemViews(),HEAP32)[(tmPtr+12)/4]=date.getUTCDate();(growMemViews(),HEAP32)[(tmPtr+16)/4]=date.getUTCMonth();(growMemViews(),HEAP32)[(tmPtr+20)/4]=date.getUTCFullYear()-1900;(growMemViews(),HEAP32)[(tmPtr+24)/4]=date.getUTCDay();var start=Date.UTC(date.getUTCFullYear(),0,1,0,0,0,0);var yday=(date.getTime()-start)/(1e3*60*60*24)|0;(growMemViews(),HEAP32)[(tmPtr+28)/4]=yday;return 0}var isLeapYear=year=>year%4===0&&(year%100!==0||year%400===0);var MONTH_DAYS_LEAP_CUMULATIVE=[0,31,60,91,121,152,182,213,244,274,305,335];var MONTH_DAYS_REGULAR_CUMULATIVE=[0,31,59,90,120,151,181,212,243,273,304,334];var ydayFromDate=date=>{var leap=isLeapYear(date.getFullYear());var monthDaysCumulative=leap?MONTH_DAYS_LEAP_CUMULATIVE:MONTH_DAYS_REGULAR_CUMULATIVE;var yday=monthDaysCumulative[date.getMonth()]+date.getDate()-1;return yday};function __localtime_js(time,tmPtr){time=bigintToI53Checked(time);tmPtr=bigintToI53Checked(tmPtr);var date=new Date(time*1e3);if(isNaN(date.getTime())){return 1}(growMemViews(),HEAP32)[tmPtr/4]=date.getSeconds();(growMemViews(),HEAP32)[(tmPtr+4)/4]=date.getMinutes();(growMemViews(),HEAP32)[(tmPtr+8)/4]=date.getHours();(growMemViews(),HEAP32)[(tmPtr+12)/4]=date.getDate();(growMemViews(),HEAP32)[(tmPtr+16)/4]=date.getMonth();(growMemViews(),HEAP32)[(tmPtr+20)/4]=date.getFullYear()-1900;(growMemViews(),HEAP32)[(tmPtr+24)/4]=date.getDay();var yday=ydayFromDate(date)|0;(growMemViews(),HEAP32)[(tmPtr+28)/4]=yday;(growMemViews(),HEAP64)[(tmPtr+40)/8]=BigInt(-(date.getTimezoneOffset()*60));var start=new Date(date.getFullYear(),0,1);var summerOffset=new Date(date.getFullYear(),6,1).getTimezoneOffset();var winterOffset=start.getTimezoneOffset();var dst=(summerOffset!=winterOffset&&date.getTimezoneOffset()==Math.min(winterOffset,summerOffset))|0;(growMemViews(),HEAP32)[(tmPtr+32)/4]=dst;return 0}var __mktime_js=function(tmPtr){tmPtr=bigintToI53Checked(tmPtr);var ret=(()=>{var date=new Date((growMemViews(),HEAP32)[(tmPtr+20)/4]+1900,(growMemViews(),HEAP32)[(tmPtr+16)/4],(growMemViews(),HEAP32)[(tmPtr+12)/4],(growMemViews(),HEAP32)[(tmPtr+8)/4],(growMemViews(),HEAP32)[(tmPtr+4)/4],(growMemViews(),HEAP32)[tmPtr/4],0);if(isNaN(date.getTime())){return-1}var dst=(growMemViews(),HEAP32)[(tmPtr+32)/4];var guessedOffset=date.getTimezoneOffset();var start=new Date(date.getFullYear(),0,1);var summerOffset=new Date(date.getFullYear(),6,1).getTimezoneOffset();var winterOffset=start.getTimezoneOffset();var dstOffset=Math.min(winterOffset,summerOffset);if(dst<0){dst=Number(summerOffset!=winterOffset&&dstOffset==guessedOffset)}else if(dst>0!=(dstOffset==guessedOffset)){var nonDstOffset=Math.max(winterOffset,summerOffset);var trueOffset=dst>0?dstOffset:nonDstOffset;date.setTime(date.getTime()+(trueOffset-guessedOffset)*6e4);if(isNaN(date.getTime())){return-1}}(growMemViews(),HEAP32)[(tmPtr+32)/4]=dst;(growMemViews(),HEAP32)[(tmPtr+24)/4]=date.getDay();var yday=ydayFromDate(date)|0;(growMemViews(),HEAP32)[(tmPtr+28)/4]=yday;(growMemViews(),HEAP32)[tmPtr/4]=date.getSeconds();(growMemViews(),HEAP32)[(tmPtr+4)/4]=date.getMinutes();(growMemViews(),HEAP32)[(tmPtr+8)/4]=date.getHours();(growMemViews(),HEAP32)[(tmPtr+12)/4]=date.getDate();(growMemViews(),HEAP32)[(tmPtr+16)/4]=date.getMonth();(growMemViews(),HEAP32)[(tmPtr+20)/4]=date.getYear();return date.getTime()/1e3})();return BigInt(ret)};var __tzset_js=function(timezone,daylight,std_name,dst_name){timezone=bigintToI53Checked(timezone);daylight=bigintToI53Checked(daylight);std_name=bigintToI53Checked(std_name);dst_name=bigintToI53Checked(dst_name);var currentYear=(new Date).getFullYear();var winter=new Date(currentYear,0,1);var summer=new Date(currentYear,6,1);var winterOffset=winter.getTimezoneOffset();var summerOffset=summer.getTimezoneOffset();var stdTimezoneOffset=Math.max(winterOffset,summerOffset);(growMemViews(),HEAPU64)[timezone/8]=BigInt(stdTimezoneOffset*60);(growMemViews(),HEAP32)[daylight/4]=Number(winterOffset!=summerOffset);var extractZone=timezoneOffset=>{var sign=timezoneOffset>=0?"-":"+";var absOffset=Math.abs(timezoneOffset);var hours=String(Math.floor(absOffset/60)).padStart(2,"0");var minutes=String(absOffset%60).padStart(2,"0");return`UTC${sign}${hours}${minutes}`};var winterName=extractZone(winterOffset);var summerName=extractZone(summerOffset);if(summerOffset<winterOffset){stringToUTF8(winterName,std_name,17);stringToUTF8(summerName,dst_name,17)}else{stringToUTF8(winterName,dst_name,17);stringToUTF8(summerName,std_name,17)}};var _emscripten_get_now=()=>performance.timeOrigin+performance.now();var _emscripten_date_now=()=>Date.now();var nowIsMonotonic=1;var checkWasiClock=clock_id=>clock_id>=0&&clock_id<=3;function _clock_time_get(clk_id,ignored_precision,ptime){ignored_precision=bigintToI53Checked(ignored_precision);ptime=bigintToI53Checked(ptime);if(!checkWasiClock(clk_id)){return 28}var now;if(clk_id===0){now=_emscripten_date_now()}else if(nowIsMonotonic){now=_emscripten_get_now()}else{return 52}var nsec=Math.round(now*1e3*1e3);(growMemViews(),HEAP64)[ptime/8]=BigInt(nsec);return 0}var readEmAsmArgsArray=[];var readEmAsmArgs=(sigPtr,buf)=>{readEmAsmArgsArray.length=0;var ch;while(ch=(growMemViews(),HEAPU8)[sigPtr++]){var wide=ch!=105;buf+=wide&&buf%8?4:0;readEmAsmArgsArray.push(ch==112?Number((growMemViews(),HEAPU64)[buf/8]):ch==106?(growMemViews(),HEAP64)[buf/8]:ch==105?(growMemViews(),HEAP32)[buf/4]:(growMemViews(),HEAPF64)[buf/8]);buf+=wide?8:4}return readEmAsmArgsArray};var runEmAsmFunction=(code,sigPtr,argbuf)=>{var args=readEmAsmArgs(sigPtr,argbuf);return ASM_CONSTS[code](...args)};function _emscripten_asm_const_int(code,sigPtr,argbuf){code=bigintToI53Checked(code);sigPtr=bigintToI53Checked(sigPtr);argbuf=bigintToI53Checked(argbuf);return runEmAsmFunction(code,sigPtr,argbuf)}var runMainThreadEmAsm=(emAsmAddr,sigPtr,argbuf,sync)=>{var args=readEmAsmArgs(sigPtr,argbuf);if(ENVIRONMENT_IS_PTHREAD){return proxyToMainThread(0,emAsmAddr,sync,...args)}return ASM_CONSTS[emAsmAddr](...args)};function _emscripten_asm_const_int_sync_on_main_thread(emAsmAddr,sigPtr,argbuf){emAsmAddr=bigintToI53Checked(emAsmAddr);sigPtr=bigintToI53Checked(sigPtr);argbuf=bigintToI53Checked(argbuf);return runMainThreadEmAsm(emAsmAddr,sigPtr,argbuf,1)}var _emscripten_check_blocking_allowed=()=>{};var runtimeKeepalivePush=()=>{runtimeKeepaliveCounter+=1};var _emscripten_exit_with_live_runtime=()=>{runtimeKeepalivePush();throw"unwind"};var getHeapMax=()=>17179869184;var _emscripten_get_heap_max=()=>BigInt(getHeapMax());var _emscripten_num_logical_cores=()=>navigator["hardwareConcurrency"];var alignMemory=(size,alignment)=>Math.ceil(size/alignment)*alignment;var growMemory=size=>{var oldHeapSize=wasmMemory.buffer.byteLength;var pages=(size-oldHeapSize+65535)/65536|0;try{wasmMemory.grow(BigInt(pages));updateMemoryViews();return 1}catch(e){}};function _emscripten_resize_heap(requestedSize){requestedSize=bigintToI53Checked(requestedSize);var oldSize=(growMemViews(),HEAPU8).length;if(requestedSize<=oldSize){return false}var maxHeapSize=getHeapMax();if(requestedSize>maxHeapSize){return false}for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignMemory(Math.max(requestedSize,overGrownHeapSize),65536));var replacement=growMemory(newSize);if(replacement){return true}}return false}var convertFrameToPC=frame=>{var match;if(match=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(frame)){return+match[1]}else if(match=/:(\d+):\d+(?:\)|$)/.exec(frame)){return 2147483648|+match[1]}return 0};var UNWIND_CACHE={};var saveInUnwindCache=callstack=>{for(var line of callstack){var pc=convertFrameToPC(line);if(pc){UNWIND_CACHE[pc]=line}}};var jsStackTrace=()=>(new Error).stack.toString();var _emscripten_stack_snapshot=function(){var ret=(()=>{var callstack=jsStackTrace().split("\n");if(callstack[0]=="Error"){callstack.shift()}saveInUnwindCache(callstack);UNWIND_CACHE.last_addr=convertFrameToPC(callstack[3]);UNWIND_CACHE.last_stack=callstack;return UNWIND_CACHE.last_addr})();return BigInt(ret)};function _emscripten_stack_unwind_buffer(addr,buffer,count){addr=bigintToI53Checked(addr);buffer=bigintToI53Checked(buffer);var stack;if(UNWIND_CACHE.last_addr==addr){stack=UNWIND_CACHE.last_stack}else{stack=jsStackTrace().split("\n");if(stack[0]=="Error"){stack.shift()}saveInUnwindCache(stack)}var offset=3;while(stack[offset]&&convertFrameToPC(stack[offset])!=addr){++offset}for(var i=0;i<count&&stack[i+offset];++i){(growMemViews(),HEAPU64)[(buffer+i*8)/8]=BigInt(convertFrameToPC(stack[i+offset]))}return i}var ENV={};var getExecutableName=()=>thisProgram;var getEnvStrings=()=>{if(!getEnvStrings.strings){var lang=(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8";var env={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:lang,_:getExecutableName()};for(var x in ENV){if(ENV[x]===undefined)delete env[x];else env[x]=ENV[x]}var strings=[];for(var x in env){strings.push(`${x}=${env[x]}`)}getEnvStrings.strings=strings}return getEnvStrings.strings};function _environ_get(__environ,environ_buf){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(30,0,1,__environ,environ_buf);__environ=bigintToI53Checked(__environ);environ_buf=bigintToI53Checked(environ_buf);var bufSize=0;var envp=0;for(var string of getEnvStrings()){var ptr=environ_buf+bufSize;(growMemViews(),HEAPU64)[(__environ+envp)/8]=BigInt(ptr);bufSize+=stringToUTF8(string,ptr,Infinity)+1;envp+=8}return 0}function _environ_sizes_get(penviron_count,penviron_buf_size){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(31,0,1,penviron_count,penviron_buf_size);penviron_count=bigintToI53Checked(penviron_count);penviron_buf_size=bigintToI53Checked(penviron_buf_size);var strings=getEnvStrings();(growMemViews(),HEAPU64)[penviron_count/8]=BigInt(strings.length);var bufSize=0;for(var string of strings){bufSize+=lengthBytesUTF8(string)+1}(growMemViews(),HEAPU64)[penviron_buf_size/8]=BigInt(bufSize);return 0}function _fd_close(fd){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(32,0,1,fd);try{var stream=SYSCALLS.getStreamFromFD(fd);FS.close(stream);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}var doReadv=(stream,iov,iovcnt,offset)=>{var ret=0;for(var i=0;i<iovcnt;i++){var ptr=Number((growMemViews(),HEAPU64)[iov/8]);var len=Number((growMemViews(),HEAPU64)[(iov+8)/8]);iov+=16;try{var curr=FS.read(stream,(growMemViews(),HEAP8),ptr,len,offset)}catch(e){if(ret>0&&e instanceof FS.ErrnoError&&(e.errno==6||e.errno==6)){break}throw e}if(curr<0)return-1;ret+=curr;if(curr<len)break;if(typeof offset!="undefined"){offset+=curr}}return ret};function _fd_pread(fd,iov,iovcnt,offset,pnum){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(33,0,1,fd,iov,iovcnt,offset,pnum);iov=bigintToI53Checked(iov);iovcnt=bigintToI53Checked(iovcnt);offset=bigintToI53Checked(offset);pnum=bigintToI53Checked(pnum);try{if(isNaN(offset))return 22;var stream=SYSCALLS.getStreamFromFD(fd);var num=doReadv(stream,iov,iovcnt,offset);(growMemViews(),HEAPU64)[pnum/8]=BigInt(num);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}var doWritev=(stream,iov,iovcnt,offset)=>{if(iovcnt==1){return FS.write(stream,(growMemViews(),HEAP8),Number((growMemViews(),HEAPU64)[iov/8]),Number((growMemViews(),HEAPU64)[(iov+8)/8]),offset)}var total=0;for(var i=0,p=iov;i<iovcnt;i++,p+=16){total+=Number((growMemViews(),HEAPU64)[(p+8)/8])}var view=new Uint8Array(total);var voff=0;for(var i=0;i<iovcnt;i++,iov+=16){var ptr=Number((growMemViews(),HEAPU64)[iov/8]);var len=Number((growMemViews(),HEAPU64)[(iov+8)/8]);view.set((growMemViews(),HEAPU8).subarray(ptr,ptr+len),voff);voff+=len}return FS.write(stream,view,0,total,offset)};function _fd_pwrite(fd,iov,iovcnt,offset,pnum){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(34,0,1,fd,iov,iovcnt,offset,pnum);iov=bigintToI53Checked(iov);iovcnt=bigintToI53Checked(iovcnt);offset=bigintToI53Checked(offset);pnum=bigintToI53Checked(pnum);try{if(isNaN(offset))return 22;var stream=SYSCALLS.getStreamFromFD(fd);var num=doWritev(stream,iov,iovcnt,offset);(growMemViews(),HEAPU64)[pnum/8]=BigInt(num);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}function _fd_read(fd,iov,iovcnt,pnum){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(35,0,1,fd,iov,iovcnt,pnum);iov=bigintToI53Checked(iov);iovcnt=bigintToI53Checked(iovcnt);pnum=bigintToI53Checked(pnum);try{var stream=SYSCALLS.getStreamFromFD(fd);var num=doReadv(stream,iov,iovcnt);(growMemViews(),HEAPU64)[pnum/8]=BigInt(num);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}function _fd_seek(fd,offset,whence,newOffset){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(36,0,1,fd,offset,whence,newOffset);offset=bigintToI53Checked(offset);newOffset=bigintToI53Checked(newOffset);try{if(isNaN(offset))return 22;var stream=SYSCALLS.getStreamFromFD(fd);FS.llseek(stream,offset,whence);(growMemViews(),HEAP64)[newOffset/8]=BigInt(stream.position);if(stream.getdents&&!offset&&whence===0)stream.getdents=null;return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}function _fd_write(fd,iov,iovcnt,pnum){if(ENVIRONMENT_IS_PTHREAD)return proxyToMainThread(37,0,1,fd,iov,iovcnt,pnum);iov=bigintToI53Checked(iov);iovcnt=bigintToI53Checked(iovcnt);pnum=bigintToI53Checked(pnum);try{var stream=SYSCALLS.getStreamFromFD(fd);var num=doWritev(stream,iov,iovcnt);(growMemViews(),HEAPU64)[pnum/8]=BigInt(num);return 0}catch(e){if(typeof FS=="undefined"||!(e.name==="ErrnoError"))throw e;return e.errno}}var stringToUTF8OnStack=str=>{var size=lengthBytesUTF8(str)+1;var ret=stackAlloc(size);stringToUTF8(str,ret,size);return ret};PThread.init();FS.createPreloadedFile=FS_createPreloadedFile;FS.preloadFile=FS_preloadFile;FS.staticInit();{initMemory();if(Module["noExitRuntime"])noExitRuntime=Module["noExitRuntime"];if(Module["print"])out=Module["print"];if(Module["printErr"])err=Module["printErr"];if(Module["arguments"])programArgs=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];var preInit=Module["preInit"];if(preInit){if(typeof preInit=="function")Module["preInit"]=preInit=[preInit];while(preInit.length>0){preInit.shift()()}}}var proxiedFunctionTable=[_proc_exit,exitOnMainThread,pthreadCreateProxied,___syscall_accept4,___syscall_bind,___syscall_connect,___syscall_fcntl64,___syscall_fstat64,___syscall_ftruncate64,___syscall_getcwd,___syscall_getdents64,___syscall_getsockname,___syscall_getsockopt,___syscall_ioctl,___syscall_listen,___syscall_lstat64,___syscall_mkdirat,___syscall_newfstatat,___syscall_openat,___syscall_poll,___syscall_recvfrom,___syscall_renameat,___syscall_rmdir,___syscall_sendto,___syscall_setsockopt,___syscall_shutdown,___syscall_socket,___syscall_stat64,___syscall_statfs64,___syscall_unlinkat,_environ_get,_environ_sizes_get,_fd_close,_fd_pread,_fd_pwrite,_fd_read,_fd_seek,_fd_write];var ASM_CONSTS={7980558:($0,$1)=>{stringToUTF8(typeof navigator!=="undefined"&&navigator.language?navigator.language:"en-US",$0,$1)},7980673:$0=>typeof window!=="undefined"&&window.open(UTF8ToString($0),"_blank")?1:0,7980768:()=>{if(typeof location!=="undefined"&&location.reload)location.reload()}};function wasm_now_ms(){var o=globalThis.__wasmTimeOrigin;if(o===undefined)o=globalThis.__wasmTimeOrigin=performance.timeOrigin;return o+performance.now()}function wasm_hang_line_js(s){out(UTF8ToString(Number(s)))}function wasm_audio_publish_js(ring,capacity){if(typeof process!=="undefined"&&process.versions&&process.versions.node)return;postMessage({audio:{memory:wasmMemory,ring:Number(ring),capacity}})}function wasm_httpfs_manifest_js(buf,cap){if(typeof XMLHttpRequest==="undefined")return-1;let bytes=globalThis.__httpfsManifest;if(bytes===undefined){bytes=null;try{const x=new XMLHttpRequest;x.open("GET",self.location.origin+"/data/manifest.json",false);x.send();if(x.status===200)bytes=(new TextEncoder).encode(x.responseText)}catch(e){console.error("httpfs: manifest failed: "+e)}globalThis.__httpfsManifest=bytes}if(bytes===null)return-1;if(cap>bytes.length){(growMemViews(),HEAPU8).set(bytes,Number(buf));(growMemViews(),HEAPU8)[Number(buf)+bytes.length]=0;globalThis.__httpfsManifest=undefined}return bytes.length}function wasm_httpfs_io_start_js(table){if(ENVIRONMENT_IS_PTHREAD||!Module["ioWorker"]||Module["__ioStarted"])return;Module["__ioStarted"]=true;Module["ioWorker"].postMessage({memory:wasmMemory,table:Number(table)})}function wasm_userdata_page_js(){return typeof process!=="undefined"&&process.versions&&process.versions.node||ENVIRONMENT_IS_PTHREAD||!Module["ioWorker"]?0:1}function wasm_userdata_put_js(path,data,size,mtimeMs){Module["ioWorker"].postMessage({userdata:{path:UTF8ToString(Number(path)),data:(growMemViews(),HEAPU8).slice(Number(data),Number(data)+Number(size)),mtime:mtimeMs}})}function wasm_userdata_delete_js(path){Module["ioWorker"].postMessage({userdataDelete:UTF8ToString(Number(path))})}function wgpu_start_worker(ring,size,dbg){ring=Number(ring);size=Number(size);var msg={memory:wasmMemory,ring,size,dbg:Number(dbg),shaderUrl:Module["wgpuShaderUrl"]||"/shaders",shotEvery:Module["wgpuShotEvery"]||0};if(typeof process!=="undefined"&&process.versions&&process.versions.node){var wt=require("worker_threads");var path=require("path");var file=process.env.WGPU_WORKER||path.join(__dirname,"wgpu_worker.js");var w=new wt.Worker(file);w.unref();w.on("error",function(e){console.error("[wgpu] worker error: "+(e&&e.stack||e))});w.postMessage(msg)}else{var w=Module["wgpuWorker"]||new Worker(Module["wgpuWorkerUrl"]||"wgpu_worker.js");out("[wgpu] worker started from "+(ENVIRONMENT_IS_PTHREAD?"a pthread":"the runtime main thread")+", canvas "+(Module["canvas"]?Module["canvas"].constructor.name:"none"));var transfer=[];if(Module["canvas"]&&typeof OffscreenCanvas!=="undefined"&&Module["canvas"]instanceof OffscreenCanvas){msg.canvas=Module["canvas"];transfer.push(msg.canvas)}w.postMessage(msg,transfer)}}function wasm_input_publish_js(block){if(typeof process!=="undefined"&&process.versions&&process.versions.node)return;postMessage({input:{memory:wasmMemory,block:Number(block)}})}function wasm_has_page_js(){return typeof process!=="undefined"&&process.versions&&process.versions.node?0:1}function wasm_module_int_js(name,defaultValue){const key=UTF8ToString(Number(name));if(typeof Module!=="undefined"&&Module[key]!==undefined)return Module[key]|0;if(typeof process!=="undefined"&&process.env){const env=process.env[key.toUpperCase()];if(env!==undefined)return parseInt(env,10)|0}return defaultValue}function wasm_print_line_js(s){out(UTF8ToString(Number(s)))}var _main,_pthread_self,_fflush,_htons,_ntohs,__emscripten_tls_init,___funcs_on_exit,__emscripten_thread_init,___set_thread_state,__emscripten_thread_crashed,__emscripten_run_js_on_main_thread_done,__emscripten_run_js_on_main_thread,__emscripten_thread_free_data,__emscripten_thread_exit,__emscripten_check_mailbox,_setThrew,_emscripten_stack_set_limits,__emscripten_stack_restore,__emscripten_stack_alloc,_emscripten_stack_get_current,__indirect_function_table,wasmTable;function assignWasmExports(wasmExports){_main=Module["_main"]=wasmExports["__main_argc_argv"];_pthread_self=wasmExports["pthread_self"];_fflush=wasmExports["fflush"];_htons=wasmExports["htons"];_ntohs=wasmExports["ntohs"];__emscripten_tls_init=wasmExports["_emscripten_tls_init"];___funcs_on_exit=wasmExports["__funcs_on_exit"];__emscripten_thread_init=wasmExports["_emscripten_thread_init"];___set_thread_state=wasmExports["__set_thread_state"];__emscripten_thread_crashed=wasmExports["_emscripten_thread_crashed"];__emscripten_run_js_on_main_thread_done=wasmExports["_emscripten_run_js_on_main_thread_done"];__emscripten_run_js_on_main_thread=wasmExports["_emscripten_run_js_on_main_thread"];__emscripten_thread_free_data=wasmExports["_emscripten_thread_free_data"];__emscripten_thread_exit=wasmExports["_emscripten_thread_exit"];__emscripten_check_mailbox=wasmExports["_emscripten_check_mailbox"];_setThrew=wasmExports["setThrew"];_emscripten_stack_set_limits=wasmExports["emscripten_stack_set_limits"];__emscripten_stack_restore=wasmExports["_emscripten_stack_restore"];__emscripten_stack_alloc=wasmExports["_emscripten_stack_alloc"];_emscripten_stack_get_current=wasmExports["emscripten_stack_get_current"];__indirect_function_table=wasmTable=wasmExports["__indirect_function_table"]}var wasmImports;function assignWasmImports(){wasmImports={__pthread_create_js:___pthread_create_js,__syscall_accept4:___syscall_accept4,__syscall_bind:___syscall_bind,__syscall_connect:___syscall_connect,__syscall_fcntl64:___syscall_fcntl64,__syscall_fstat64:___syscall_fstat64,__syscall_ftruncate64:___syscall_ftruncate64,__syscall_getcwd:___syscall_getcwd,__syscall_getdents64:___syscall_getdents64,__syscall_getsockname:___syscall_getsockname,__syscall_getsockopt:___syscall_getsockopt,__syscall_ioctl:___syscall_ioctl,__syscall_listen:___syscall_listen,__syscall_lstat64:___syscall_lstat64,__syscall_mkdirat:___syscall_mkdirat,__syscall_newfstatat:___syscall_newfstatat,__syscall_openat:___syscall_openat,__syscall_poll:___syscall_poll,__syscall_recvfrom:___syscall_recvfrom,__syscall_renameat:___syscall_renameat,__syscall_rmdir:___syscall_rmdir,__syscall_sendto:___syscall_sendto,__syscall_setsockopt:___syscall_setsockopt,__syscall_shutdown:___syscall_shutdown,__syscall_socket:___syscall_socket,__syscall_stat64:___syscall_stat64,__syscall_statfs64:___syscall_statfs64,__syscall_unlinkat:___syscall_unlinkat,_abort_js:__abort_js,_emscripten_init_main_thread_js:__emscripten_init_main_thread_js,_emscripten_notify_mailbox_postmessage:__emscripten_notify_mailbox_postmessage,_emscripten_receive_on_main_thread_js:__emscripten_receive_on_main_thread_js,_emscripten_system:__emscripten_system,_emscripten_thread_cleanup:__emscripten_thread_cleanup,_emscripten_thread_mailbox_await:__emscripten_thread_mailbox_await,_emscripten_thread_set_strongref:__emscripten_thread_set_strongref,_emscripten_throw_longjmp:__emscripten_throw_longjmp,_gmtime_js:__gmtime_js,_localtime_js:__localtime_js,_mktime_js:__mktime_js,_tzset_js:__tzset_js,clock_time_get:_clock_time_get,emscripten_asm_const_int:_emscripten_asm_const_int,emscripten_asm_const_int_sync_on_main_thread:_emscripten_asm_const_int_sync_on_main_thread,emscripten_check_blocking_allowed:_emscripten_check_blocking_allowed,emscripten_date_now:_emscripten_date_now,emscripten_exit_with_live_runtime:_emscripten_exit_with_live_runtime,emscripten_get_heap_max:_emscripten_get_heap_max,emscripten_get_now:_emscripten_get_now,emscripten_num_logical_cores:_emscripten_num_logical_cores,emscripten_resize_heap:_emscripten_resize_heap,emscripten_stack_snapshot:_emscripten_stack_snapshot,emscripten_stack_unwind_buffer:_emscripten_stack_unwind_buffer,environ_get:_environ_get,environ_sizes_get:_environ_sizes_get,exit:_exit,fd_close:_fd_close,fd_pread:_fd_pread,fd_pwrite:_fd_pwrite,fd_read:_fd_read,fd_seek:_fd_seek,fd_write:_fd_write,invoke_iiijj,invoke_ij,invoke_iji,invoke_ijji,invoke_ijjiii,invoke_jj,invoke_jjiiijij,invoke_jjij,invoke_jjj,invoke_vj,invoke_vjii,invoke_vjij,invoke_vjj,invoke_vjjii,memory:wasmMemory,proc_exit:_proc_exit,wasm_audio_publish_js,wasm_hang_line_js,wasm_has_page_js,wasm_httpfs_io_start_js,wasm_httpfs_manifest_js,wasm_input_publish_js,wasm_module_int_js,wasm_now_ms,wasm_print_line_js,wasm_userdata_delete_js,wasm_userdata_page_js,wasm_userdata_put_js,wgpu_start_worker}}function invoke_vjj(index,a1,a2){var sp=stackSave();try{getWasmTableEntry(Number(index))(a1,a2)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0)}}function invoke_ij(index,a1){var sp=stackSave();try{return getWasmTableEntry(Number(index))(a1)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0)}}function invoke_jj(index,a1){var sp=stackSave();try{return getWasmTableEntry(Number(index))(a1)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0);return 0n}}function invoke_vj(index,a1){var sp=stackSave();try{getWasmTableEntry(Number(index))(a1)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0)}}function invoke_vjij(index,a1,a2,a3){var sp=stackSave();try{getWasmTableEntry(Number(index))(a1,a2,a3)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0)}}function invoke_jjij(index,a1,a2,a3){var sp=stackSave();try{return getWasmTableEntry(Number(index))(a1,a2,a3)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0);return 0n}}function invoke_vjii(index,a1,a2,a3){var sp=stackSave();try{getWasmTableEntry(Number(index))(a1,a2,a3)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0)}}function invoke_iji(index,a1,a2){var sp=stackSave();try{return getWasmTableEntry(Number(index))(a1,a2)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0)}}function invoke_jjj(index,a1,a2){var sp=stackSave();try{return getWasmTableEntry(Number(index))(a1,a2)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0);return 0n}}function invoke_vjjii(index,a1,a2,a3,a4){var sp=stackSave();try{getWasmTableEntry(Number(index))(a1,a2,a3,a4)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0)}}function invoke_jjiiijij(index,a1,a2,a3,a4,a5,a6,a7){var sp=stackSave();try{return getWasmTableEntry(Number(index))(a1,a2,a3,a4,a5,a6,a7)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0);return 0n}}function invoke_iiijj(index,a1,a2,a3,a4){var sp=stackSave();try{return getWasmTableEntry(Number(index))(a1,a2,a3,a4)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0)}}function invoke_ijji(index,a1,a2,a3){var sp=stackSave();try{return getWasmTableEntry(Number(index))(a1,a2,a3)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0)}}function invoke_ijjiii(index,a1,a2,a3,a4,a5){var sp=stackSave();try{return getWasmTableEntry(Number(index))(a1,a2,a3,a4,a5)}catch(e){stackRestore(sp);if(!(e instanceof EmscriptenEH))throw e;_setThrew(1,0)}}function applySignatureConversions(wasmExports){wasmExports=Object.assign({},wasmExports);var makeWrapper___PP=f=>(a0,a1,a2)=>f(a0,BigInt(a1?a1:0),BigInt(a2?a2:0));var makeWrapper_p=f=>()=>Number(f());var makeWrapper__p=f=>a0=>f(BigInt(a0));var makeWrapper__p_____=f=>(a0,a1,a2,a3,a4,a5)=>f(BigInt(a0),a1,a2,a3,a4,a5);var makeWrapper__p___=f=>(a0,a1,a2,a3)=>f(BigInt(a0),a1,a2,a3);var makeWrapper__pp_=f=>(a0,a1,a2)=>f(BigInt(a0),BigInt(a1),a2);var makeWrapper___p_p_=f=>(a0,a1,a2,a3,a4)=>f(a0,BigInt(a1),a2,BigInt(a3),a4);var makeWrapper__p_=f=>(a0,a1)=>f(BigInt(a0),a1);var makeWrapper__pp=f=>(a0,a1)=>f(BigInt(a0),BigInt(a1));var makeWrapper_pp=f=>a0=>Number(f(BigInt(a0)));wasmExports["__main_argc_argv"]=makeWrapper___PP(wasmExports["__main_argc_argv"]);wasmExports["pthread_self"]=makeWrapper_p(wasmExports["pthread_self"]);wasmExports["fflush"]=makeWrapper__p(wasmExports["fflush"]);wasmExports["_emscripten_tls_init"]=makeWrapper_p(wasmExports["_emscripten_tls_init"]);wasmExports["_emscripten_thread_init"]=makeWrapper__p_____(wasmExports["_emscripten_thread_init"]);wasmExports["__set_thread_state"]=makeWrapper__p___(wasmExports["__set_thread_state"]);wasmExports["_emscripten_run_js_on_main_thread_done"]=makeWrapper__pp_(wasmExports["_emscripten_run_js_on_main_thread_done"]);wasmExports["_emscripten_run_js_on_main_thread"]=makeWrapper___p_p_(wasmExports["_emscripten_run_js_on_main_thread"]);wasmExports["_emscripten_thread_free_data"]=makeWrapper__p(wasmExports["_emscripten_thread_free_data"]);wasmExports["_emscripten_thread_exit"]=makeWrapper__p(wasmExports["_emscripten_thread_exit"]);wasmExports["setThrew"]=makeWrapper__p_(wasmExports["setThrew"]);wasmExports["emscripten_stack_set_limits"]=makeWrapper__pp(wasmExports["emscripten_stack_set_limits"]);wasmExports["_emscripten_stack_restore"]=makeWrapper__p(wasmExports["_emscripten_stack_restore"]);wasmExports["_emscripten_stack_alloc"]=makeWrapper_pp(wasmExports["_emscripten_stack_alloc"]);wasmExports["emscripten_stack_get_current"]=makeWrapper_p(wasmExports["emscripten_stack_get_current"]);return wasmExports}function callMain(args=[]){var entryFunction=_main;args.unshift(thisProgram);var argc=args.length;var argv=stackAlloc((argc+1)*8);var argv_ptr=argv;for(var arg of args){(growMemViews(),HEAPU64)[argv_ptr/8]=BigInt(stringToUTF8OnStack(arg));argv_ptr+=8}(growMemViews(),HEAPU64)[argv_ptr/8]=0n;try{var ret=entryFunction(argc,BigInt(argv));exitJS(ret,true);return ret}catch(e){return handleException(e)}}async function run(args=programArgs){if(ENVIRONMENT_IS_PTHREAD){initRuntime();return}preRun();if(runDependencies){await resolveRunDependencies()}var setStatus=Module["setStatus"];if(setStatus){setStatus("Running...");await new Promise(resolve=>setTimeout(resolve,1));setTimeout(setStatus,1,"")}if(ABORT)return;initRuntime();Module["onRuntimeInitialized"]?.();var noInitialRun=Module["noInitialRun"]||false;if(!noInitialRun)callMain(args);postRun()}var wasmExports;if(!ENVIRONMENT_IS_PTHREAD){createWasm().then(()=>run())}

// --- GTA V Web Trainer Hook ---
function installGtaTrainer(wasmExports) {
  const table = wasmExports["__indirect_function_table"] || (typeof wasmTable !== "undefined" ? wasmTable : null);
  const mem = (typeof wasmMemory !== "undefined" && wasmMemory) ? wasmMemory : (wasmExports["memory"] || null);
  if (!table || !mem) return;

  function tableGet(idx) {
    try { return table.get(BigInt(idx)); } catch (e) { return table.get(Number(idx)); }
  }
  function tableSet(idx, val) {
    try { table.set(BigInt(idx), val); } catch (e) { table.set(Number(idx), val); }
  }

  function joaat(s) {
    let h = 0;
    const str = String(s || "").toLowerCase();
    for (let i = 0; i < str.length; i++) {
      h += str.charCodeAt(i);
      h = (h + (h << 10)) >>> 0;
      h ^= (h >>> 6);
    }
    h = (h + (h << 3)) >>> 0;
    h ^= (h >>> 11);
    h = (h + (h << 15)) >>> 0;
    return h >>> 0;
  }

  let memBuf = null, I32, F32, U8, I64;
  function updateViews() {
    const b = (typeof wasmMemory !== "undefined" && wasmMemory && wasmMemory.buffer) ? wasmMemory.buffer : mem.buffer;
    if (b !== memBuf) {
      memBuf = b;
      I32 = new Int32Array(b);
      F32 = new Float32Array(b);
      U8 = new Uint8Array(b);
      I64 = new BigInt64Array(b);
    }
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  // Rate-limited diagnostics line to the dev server (burst of 30, then one every 2 s): a native that fails every tick used to POST /log ~50 times a second.
  let tlogTokens = 30, tlogT = 0;
  function tlog(msg) {
    const n = performance.now();
    tlogTokens = Math.min(30, tlogTokens + (n - tlogT) / 2000); tlogT = n;
    if (tlogTokens < 1) return;
    tlogTokens--;
    try { fetch("/log", { method: "POST", body: msg }).catch(() => {}); } catch (e) {}
  }
  function nat(slot, sig, args, refFloat) {
    updateViews();
    let sp = 0, rawAlloc = 0;
    try {
      sp = (typeof stackSave === "function") ? stackSave() : (wasmExports["emscripten_stack_get_current"] ? wasmExports["emscripten_stack_get_current"]() : 0);
    } catch (e) {}

    try {
      rawAlloc = (typeof stackAlloc === "function") ? stackAlloc(1536) : 0;
    } catch (e1) {
      try {
        rawAlloc = (typeof stackAlloc === "function") ? stackAlloc(1536n) : 0;
      } catch (e2) {}
    }
    if (!rawAlloc && wasmExports["_emscripten_stack_alloc"]) {
      try {
        rawAlloc = wasmExports["_emscripten_stack_alloc"](1536);
      } catch (e3) {
        try {
          rawAlloc = wasmExports["_emscripten_stack_alloc"](1536n);
        } catch (e4) {}
      }
    }

    const base = Number(rawAlloc);
    if (!base) {
      return { i: 0, f: 0, v: [0, 0, 0] };
    }

    const info = base, res = base + 32, par = base + 64, str = base + 768, cell = base + 1400;

    try {
      U8.fill(0, base, base + 1536);

      let p = par;
      let a = 0, outVecs = 0;
      let strPtr = str;

      if (sig && args) {
        for (let i = 0; i < sig.length; i++) {
          const c = sig[i];
          if (c === "i" || c === "b") {
            I32[p >> 2] = args[a++] | 0;
            p += 8;
          } else if (c === "f") {
            F32[p >> 2] = Number(args[a++]);
            p += 8;
          } else if (c === "v") {
            F32[p >> 2] = Number(args[a++]);
            F32[(p + 8) >> 2] = Number(args[a++]);
            F32[(p + 16) >> 2] = Number(args[a++]);
            p += 24;
          } else if (c === "s") {
            const bytes = enc.encode(String(args[a++])).subarray(0, 255);
            U8.set(bytes, strPtr);
            U8[strPtr + bytes.length] = 0;
            I64[p >> 3] = BigInt(strPtr);
            strPtr += (bytes.length + 8) & ~7;
            p += 8;
          } else if (c === "R") {
            F32[cell >> 2] = refFloat ? Number(refFloat.v || 0) : 0;
            I64[p >> 3] = BigInt(cell);
            p += 8;
          } else if (c === "P") {   // int passed by pointer (DELETE_OBJECT(Object*)): shares the "R" cell
            I32[cell >> 2] = args[a++] | 0;
            I64[p >> 3] = BigInt(cell);
            p += 8;
          } else if (c === "V") {   // out Vector3* (GET_MODEL_DIMENSIONS): read back into result.vo
            I64[p >> 3] = BigInt(cell + 8 + 24 * outVecs++);
            p += 8;
          } else if (c === "z") {   // null pointer
            I64[p >> 3] = 0n;
            p += 8;
          }
        }
      }

      const count = (p - par) >> 3;
      I64[info >> 3] = BigInt(res);
      I32[(info + 8) >> 2] = count;
      I64[(info + 16) >> 3] = BigInt(par);
      I32[(info + 24) >> 2] = 0;

      let fn = null;
      try { fn = (typeof getWasmTableEntry === "function") ? getWasmTableEntry(slot) : null; } catch (e) {}
      if (!fn) { try { fn = tableGet(slot); } catch (e) {} }
      if (!fn && typeof wasmTable !== "undefined" && wasmTable) {
        try { fn = wasmTable.get(BigInt(slot)); } catch (e) { try { fn = wasmTable.get(Number(slot)); } catch (e2) {} }
      }

      if (fn) {
        try {
          fn(BigInt(info));
        } catch (errBig) {
          try {
            fn(Number(info));
          } catch (errNum) {
            tlog("[trainer native err] slot=" + slot + " err=" + (errBig.message || errBig));
          }
        }
      } else {
        tlog("[trainer missing slot] " + slot);
      }

      updateViews();
      const outI = I32[res >> 2];
      const outF = F32[res >> 2];
      const outV = [F32[res >> 2], F32[(res + 8) >> 2], F32[(res + 16) >> 2]];

      if (refFloat) {
        refFloat.v = F32[cell >> 2];
      }

      // A native that fills a Vector3* writes it into the call context's temporary vectors (info + 64, 16 bytes each, count at info + 24) and leaves copying
      // them out to the caller (the script VM's CopyReferencedParametersOut), so read those when the pointed-to cells stayed empty.
      const vo = [], tempCount = I32[(info + 24) >> 2];
      for (let k = 0; k < outVecs; k++) {
        const q = cell + 8 + 24 * k, tq = info + 64 + 16 * k;
        const own = [F32[q >> 2], F32[(q + 8) >> 2], F32[(q + 16) >> 2]];
        vo.push(own.some((x) => x !== 0) || k >= tempCount ? own : [F32[tq >> 2], F32[(tq + 4) >> 2], F32[(tq + 8) >> 2]]);
      }
      return { i: outI, f: outF, v: outV, ci: I32[cell >> 2], vo };
    } finally {
      if (sp) {
        try {
          if (typeof stackRestore === "function") stackRestore(sp);
          else if (wasmExports["_emscripten_stack_restore"]) wasmExports["_emscripten_stack_restore"](sp);
        } catch (e1) {
          try {
            if (typeof stackRestore === "function") stackRestore(BigInt(sp));
            else if (wasmExports["_emscripten_stack_restore"]) wasmExports["_emscripten_stack_restore"](BigInt(sp));
          } catch (e2) {}
        }
      }
    }
  }

  // Exact native slots from Host/gta_natives.gen.h
  const N_GET_PLAYER_INDEX = 56445;
  const N_PLAYER_PED_ID = 56466;
  const N_GET_ENTITY_COORDS = 45996;
  const N_SET_ENTITY_COORDS = 46204;
  const N_SET_ENTITY_HEALTH = 46214;
  const N_GET_ENTITY_MAX_HEALTH = 46010;
  const N_SET_PED_ARMOUR = 54809;
  const N_SET_PLAYER_INVINCIBLE = 56502;
  const N_SET_PLAYER_WANTED_LEVEL = 56292;
  const N_SET_PLAYER_WANTED_LEVEL_NOW = 56296;
  const N_SET_MAX_WANTED_LEVEL = 56320;
  const N_CLEAR_PLAYER_WANTED_LEVEL = 56308;
  const N_GET_PLAYER_WANTED_LEVEL = 56318;
  const N_GIVE_WEAPON_TO_PED = 60682;
  const N_SET_SUPER_JUMP_THIS_FRAME = 49474;
  const N_SET_EXPLOSIVE_AMMO_THIS_FRAME = 49468;
  const N_SET_FIRE_AMMO_THIS_FRAME = 49470;
  const N_SET_EXPLOSIVE_MELEE_THIS_FRAME = 49472;
  const N_SET_RUN_SPRINT_MULTIPLIER_FOR_PLAYER = 56543;
  const N_SET_PLAYER_MODEL = 56266;
  const N_REQUEST_MODEL = 58014;
  const N_HAS_MODEL_LOADED = 58018;
  const N_SET_MODEL_AS_NO_LONGER_NEEDED = 58023;
  const N_CREATE_VEHICLE = 58959;
  const N_GET_ENTITY_HEADING = 46004;
  const N_SET_PED_INTO_VEHICLE = 54815;
  const N_GET_VEHICLE_PED_IS_IN = 54842;
  const N_IS_PED_IN_ANY_VEHICLE = 54753;
  const N_SET_VEHICLE_FIXED = 59619;
  const N_SET_VEHICLE_DIRT_LEVEL = 59504;
  const N_SET_VEHICLE_ON_GROUND_PROPERLY = 59000;
  const N_SET_CLOCK_TIME = 45410;
  const N_SET_WEATHER_TYPE_NOW_PERSIST = 48880;
  const N_SET_TIME_SCALE = 48818;
  const N_GET_FIRST_BLIP_INFO_ID = 47886;
  const N_DOES_BLIP_EXIST = 48047;
  const N_GET_BLIP_INFO_ID_COORD = 47890;
  const N_GET_GROUND_Z_FOR_3D_COORD = 48986;
  const N_SET_PED_INFINITE_AMMO_CLIP = 60678;
  const N_SET_ENTITY_INVINCIBLE = 46217;
  const N_GET_ENTITY_HEALTH = 46008;
  const N_SET_VEHICLE_FORWARD_SPEED = 59192;
  const N_IS_CONTROL_PRESSED = 54472;
  const N_DRAW_RECT = 46583;
  const N_SET_ENTITY_LOAD_COLLISION_FLAG = 46223;
  const N_HAS_COLLISION_LOADED_AROUND_ENTITY = 46225;
  const N_IS_ENTITY_WAITING_FOR_WORLD_COLLISION = 46126;
  const N_GET_ENTITY_PLAYER_IS_FREE_AIMING_AT = 56395;
  const N_HAS_PLAYER_DAMAGED_AT_LEAST_ONE_PED = 56533;
  const N_CLEAR_PLAYER_HAS_DAMAGED_AT_LEAST_ONE_PED = 56531;
  const N_IS_PED_DEAD_OR_DYING = 54763;
  const N_IS_PLAYER_FREE_AIMING = 56391;
  const N_IS_PAUSE_MENU_ACTIVE = 48470;
  const N_IS_DISABLED_CONTROL_PRESSED = 54492;
  const N_GET_ENTITY_SPEED_VECTOR = 46040;
  const N_SET_VEHICLE_ENGINE_ON = 59512;
  const N_GET_IS_LOADING_SCREEN_ACTIVE = 47342;
  const N_IS_PLAYER_PLAYING = 56326;
  const N_DOES_ENTITY_EXIST = 45952;
  const N_SET_PED_CAN_RAGDOLL = 55518;
  const N_SET_ENTITY_VISIBLE = 46243;
  const N_SET_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME = 59033;
  const N_SET_PED_DENSITY_MULTIPLIER_THIS_FRAME = 54849;
  const N_SET_RANDOM_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME = 59035;
  const N_SET_PARKED_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME = 59037;
  const N_SET_RIOT_MODE_ENABLED = 49446;
  const N_PAUSE_CLOCK = 45412;
  const N_RESTORE_PLAYER_STAMINA = 56413;
  const N_SET_GRAVITY_LEVEL = 49322;
  const N_STAT_SET_INT = 57349;
  const N_SET_VEHICLE_MOD = 59944;
  const N_GET_NUM_VEHICLE_MODS = 59950;
  const N_TOGGLE_VEHICLE_MOD = 59954;
  const N_SET_VEHICLE_COLOURS = 59098;
  const N_SET_VEHICLE_MOD_KIT = 59915;

  // Additional native slots
  const N_DELETE_ENTITY = 46149;
  const N_DELETE_VEHICLE = 58961;
  const N_SET_NIGHTVISION = 46684;
  const N_SET_SEETHROUGH = 46819;
  const N_CLEAR_AREA = 49047;
  const N_SET_PED_TO_RAGDOLL = 55503;
  const N_CLEAR_PED_BLOOD_DAMAGE_BY_ZONE = 55588;
  const N_CLEAR_PED_WETNESS = 55599;
  const N_CLEAR_PED_ENV_DIRT = 55606;
  const N_SET_SWIM_MULTIPLIER_FOR_PLAYER = 56541;
  const N_EXPLODE_VEHICLE = 59076;
  const N_SET_VEHICLE_DOORS_SHUT = 59250;
  const N_SET_VEHICLE_TYRES_CAN_BURST = 59253;
  const N_SET_VEHICLE_DOOR_OPEN = 59262;
  const N_SET_VEHICLE_REDUCE_GRIP = 59826;
  const N_REMOVE_ALL_PED_WEAPONS = 60686;
  const N_SET_ENTITY_VELOCITY = 46249;
  const N_SET_ENTITY_AS_NO_LONGER_NEEDED = 46183;
  const N_CREATE_OBJECT_NO_OFFSET = 54096, N_FREEZE_ENTITY_POSITION = 46153, N_SET_ENTITY_ROTATION = 46241, N_IS_MODEL_IN_CDIMAGE = 58025;

  // Algerian styling native slots
  const N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR = 59104;
  const N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR = 59112;
  const N_SET_VEHICLE_NUMBER_PLATE_TEXT = 59325;
  const N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX = 59332;
  const N_SET_VEHICLE_WINDOW_TINT = 59981;
  const N_SET_VEHICLE_EXTRA = 59651;
  const N_SET_VEHICLE_LIVERY = 59718;

  // Complete vehicle damage immunity & god mode native slots
  const N_SET_ENTITY_PROOFS = 46233;
  const N_SET_ENTITY_CAN_BE_DAMAGED = 46188;
  const N_SET_VEHICLE_CAN_BE_VISIBLY_DAMAGED = 59494;
  const N_SET_VEHICLE_STRONG = 59173;
  const N_SET_VEHICLE_CAN_BREAK = 59532;
  const N_SET_VEHICLE_WHEELS_CAN_BREAK = 59259;
  const N_SET_VEHICLE_CAN_DEFORM_WHEELS = 60123;
  const N_SET_VEHICLE_HAS_UNBREAKABLE_LIGHTS = 59496;
  const N_SET_VEHICLE_EXPLODES_ON_HIGH_EXPLOSION_DAMAGE = 59756;
  const N_SET_DISABLE_EXPLODE_FROM_BODY_DAMAGE_ON_COLLISION = 60441;
  const N_SET_DISABLE_VEHICLE_EXPLOSIONS_DAMAGE = 60536;
  const N_SET_VEHICLE_OCCUPANTS_TAKE_EXPLOSIVE_DAMAGE = 59678;
  const N_SET_VEHICLE_NO_EXPLOSION_DAMAGE_FROM_DRIVER = 60242;
  const N_SET_VEHICLE_ENGINE_CAN_DEGRADE = 60111;
  const N_SET_VEHICLE_CAN_ENGINE_MISSFIRE = 59623;
  const N_SET_VEHICLE_CAN_LEAK_OIL = 59625;
  const N_SET_VEHICLE_CAN_LEAK_PETROL = 59627;
  const N_SET_DISABLE_VEHICLE_PETROL_TANK_DAMAGE = 59631;
  const N_SET_VEHICLE_DAMAGE_SCALE = 60343;
  const N_SET_VEHICLE_DEFORMATION_FIXED = 59621;
  const N_GET_VEHICLE_BODY_HEALTH = 60291;
  const N_SET_VEHICLE_BODY_HEALTH = 60293;
  const N_GET_VEHICLE_ENGINE_HEALTH = 59680;
  const N_SET_VEHICLE_ENGINE_HEALTH = 59682;
  const N_GET_VEHICLE_PETROL_TANK_HEALTH = 59686;
  const N_SET_VEHICLE_PETROL_TANK_HEALTH = 59688;
  const N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN = 55751;
  const N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE = 55215;
  const N_GET_VEHICLE_PED_IS_USING = 55174;
  const N_DISABLE_VEHICLE_EXPLOSION_BREAK_OFF_PARTS = 60077;

  // Exact component and prop native slots
  const N_GET_PED_DRAWABLE_VARIATION = 55329;
  const N_GET_NUMBER_OF_PED_DRAWABLE_VARIATIONS = 55331;
  const N_GET_PED_TEXTURE_VARIATION = 55333;
  const N_GET_NUMBER_OF_PED_TEXTURE_VARIATIONS = 55335;
  const N_GET_NUMBER_OF_PED_PROP_DRAWABLE_VARIATIONS = 55337;
  const N_GET_NUMBER_OF_PED_PROP_TEXTURE_VARIATIONS = 55339;
  const N_SET_PED_COMPONENT_VARIATION = 55353;
  const N_SET_PED_RANDOM_COMPONENT_VARIATION = 55355;
  const N_SET_PED_RANDOM_PROPS = 55357;
  const N_SET_PED_DEFAULT_COMPONENT_VARIATION = 55359;
  const N_GET_PED_PROP_INDEX = 55451;
  const N_SET_PED_PROP_INDEX = 55453;
  const N_CLEAR_PED_PROP = 55457;
  const N_CLEAR_ALL_PED_PROPS = 55459;
  const N_GET_PED_PROP_TEXTURE_INDEX = 55463;


  // Menu redesign (19 Oct 2026): slots derived from the engine's own scrWrapped_<NATIVE> symbols (work/native-slots.json), checked against the known slots above
  const N_SET_POLICE_IGNORE_PLAYER = 56324;
  const N_SET_EVERYONE_IGNORE_PLAYER = 56328;
  const N_SET_PLAYER_WEAPON_DAMAGE_MODIFIER = 56673;
  const N_SET_PLAYER_MELEE_WEAPON_DAMAGE_MODIFIER = 56679;
  const N_SET_PLAYER_HEALTH_RECHARGE_MULTIPLIER = 56663;
  const N_SET_PLAYER_HEALTH_RECHARGE_MAX_PERCENT = 56667;
  const N_SET_PLAYER_NOISE_MULTIPLIER = 56723;
  const N_SET_PLAYER_SNEAKING_NOISE_MULTIPLIER = 56725;
  const N_SET_VEHICLE_CHEAT_POWER_INCREASE = 60024;
  const N_MODIFY_VEHICLE_TOP_SPEED = 60004;
  const N_SET_VEHICLE_NEON_ENABLED = 60277;
  const N_SET_VEHICLE_NEON_COLOUR = 60271;
  const N_SET_VEHICLE_GRAVITY = 60095;
  const N_SET_VEHICLE_DOORS_LOCKED = 59048;
  const N_LOWER_CONVERTIBLE_ROOF = 59659;
  const N_RAISE_CONVERTIBLE_ROOF = 59661;
  const N_SET_VEHICLE_TYRE_BURST = 59248;
  const N_SET_VEHICLE_TYRE_FIXED = 59323;
  const N_SET_VEHICLE_SIREN = 59165;
  const N_SET_ARTIFICIAL_LIGHTS_STATE = 46713;
  const N_GET_CLOCK_HOURS = 45419;
  const N_GET_CLOCK_MINUTES = 45421;
  const N_ADD_EXPLOSION = 46384;
  const N_CREATE_PED = 54737;
  const N_GET_PLAYER_GROUP = 56423;
  const N_SET_PED_AS_GROUP_MEMBER = 55049;
  const N_SET_PED_NEVER_LEAVES_GROUP = 55187;
  const N_SET_PED_RELATIONSHIP_GROUP_HASH = 55116;
  const N_IS_WEAPON_VALID = 60662;
  const N_GET_ENTITY_SPEED = 46038;
  const N_GET_OFFSET_FROM_ENTITY_IN_WORLD_COORDS = 46024;
  const N_SET_ALL_RANDOM_PEDS_FLEE = 56330;
  const N_SET_PLAYER_CAN_BE_HASSLED_BY_GANGS = 56401;
  const N_SET_CREATE_RANDOM_COPS = 55241;
  const N_DISPLAY_HUD = 47693;
  const N_DISPLAY_RADAR = 47699;
  const N_GET_CLOSEST_VEHICLE = 59450;
  const N_HAS_PED_GOT_WEAPON = 60664;
  const N_SET_PED_AMMO = 60674;
  const N_REMOVE_WEAPON_FROM_PED = 60688;
  const N_SET_CURRENT_PED_WEAPON = 60646;
  const N_GET_PED_ARMOUR = 54924;
  const N_SET_PED_ACCURACY = 54795;
  const N_SET_BLOCKING_OF_NON_TEMPORARY_EVENTS = 55474;

  const WEAPONS = [
    "WEAPON_PISTOL", "WEAPON_COMBATPISTOL", "WEAPON_APPISTOL", "WEAPON_PISTOL50",
    "WEAPON_MICROSMG", "WEAPON_SMG", "WEAPON_ASSAULTSMG", "WEAPON_ASSAULTRIFLE",
    "WEAPON_CARBINERIFLE", "WEAPON_ADVANCEDRIFLE", "WEAPON_MG", "WEAPON_COMBATMG",
    "WEAPON_PUMPSHOTGUN", "WEAPON_SAWNOFFSHOTGUN", "WEAPON_ASSAULTSHOTGUN",
    "WEAPON_BULLPUPSHOTGUN", "WEAPON_SNIPERRIFLE", "WEAPON_HEAVYSNIPER",
    "WEAPON_GRENADELAUNCHER", "WEAPON_RPG", "WEAPON_MINIGUN", "WEAPON_GRENADE",
    "WEAPON_STICKYBOMB", "WEAPON_MOLOTOV", "WEAPON_KNIFE", "WEAPON_BAT",
    "WEAPON_CROWBAR", "WEAPON_GOLFCLUB", "WEAPON_PARACHUTE"
  ];


  // Weapon catalog for the menu (index = category id sent in argInt of CMD 34). Unknown names are skipped via IS_WEAPON_VALID.
  const WEAPON_SETS = [
    ["WEAPON_PISTOL","WEAPON_COMBATPISTOL","WEAPON_APPISTOL","WEAPON_PISTOL50","WEAPON_SNSPISTOL","WEAPON_HEAVYPISTOL","WEAPON_VINTAGEPISTOL","WEAPON_STUNGUN","WEAPON_FLAREGUN","WEAPON_MARKSMANPISTOL"],
    ["WEAPON_MICROSMG","WEAPON_SMG","WEAPON_ASSAULTSMG","WEAPON_COMBATPDW","WEAPON_MACHINEPISTOL","WEAPON_MG","WEAPON_COMBATMG","WEAPON_GUSENBERG"],
    ["WEAPON_ASSAULTRIFLE","WEAPON_CARBINERIFLE","WEAPON_ADVANCEDRIFLE","WEAPON_SPECIALCARBINE","WEAPON_BULLPUPRIFLE"],
    ["WEAPON_PUMPSHOTGUN","WEAPON_SAWNOFFSHOTGUN","WEAPON_ASSAULTSHOTGUN","WEAPON_BULLPUPSHOTGUN","WEAPON_HEAVYSHOTGUN","WEAPON_MUSKET"],
    ["WEAPON_SNIPERRIFLE","WEAPON_HEAVYSNIPER","WEAPON_MARKSMANRIFLE"],
    ["WEAPON_GRENADELAUNCHER","WEAPON_RPG","WEAPON_MINIGUN","WEAPON_FIREWORK","WEAPON_RAILGUN","WEAPON_HOMINGLAUNCHER","WEAPON_COMPACTLAUNCHER"],
    ["WEAPON_GRENADE","WEAPON_STICKYBOMB","WEAPON_SMOKEGRENADE","WEAPON_BZGAS","WEAPON_MOLOTOV","WEAPON_PROXMINE","WEAPON_PETROLCAN","WEAPON_FIREEXTINGUISHER","WEAPON_FLARE","WEAPON_BALL","WEAPON_SNOWBALL"],
    ["WEAPON_KNIFE","WEAPON_NIGHTSTICK","WEAPON_HAMMER","WEAPON_BAT","WEAPON_CROWBAR","WEAPON_GOLFCLUB","WEAPON_BOTTLE","WEAPON_DAGGER","WEAPON_HATCHET","WEAPON_KNUCKLE","WEAPON_MACHETE","WEAPON_FLASHLIGHT","WEAPON_SWITCHBLADE","WEAPON_POOLCUE","WEAPON_WRENCH","WEAPON_BATTLEAXE"]
  ];

  function giveWeaponIfValid(ped, name, ammo, equip) {
    const h = joaat(name);
    if (!nat(N_IS_WEAPON_VALID, "i", [h]).i) return false;
    nat(N_GIVE_WEAPON_TO_PED, "iiibb", [ped, h, ammo, 0, equip ? 1 : 0]);
    return true;
  }

  function giveWeapons(ped) {
    for (let i = 0; i < WEAPONS.length; i++) {
      nat(N_GIVE_WEAPON_TO_PED, "iiibb", [ped, joaat(WEAPONS[i]), 9999, 0, 0]);
    }
  }

  let T32 = null, TF32 = null, TU8 = null;
  function getTrainerBuffer() {
    if (T32) return true;
    const sab = (typeof self !== "undefined" && self.__trainerSab) ? self.__trainerSab : ((typeof Module !== "undefined" && Module.trainerSab) ? Module.trainerSab : null);
    if (sab) {
      try {
        T32 = new Int32Array(sab);
        TF32 = new Float32Array(sab);
        TU8 = new Uint8Array(sab);
        Atomics.store(T32, 0, 0x47544154); // 'GTAT'
        tlog("[trainer buffer] initialized from SAB: len=" + sab.byteLength);
        return true;
      } catch (e) {
        tlog("[trainer buffer error] " + (e.message || e));
      }
    }
    return false;
  }

  function postEngineToast(msg) {
    if (!T32 || !TU8) return;
    const b = enc.encode(String(msg || "").slice(0, 95));
    TU8.fill(0, 28, 128);
    TU8.set(b, 28);
    Atomics.add(T32, 6, 1);
  }

  let appliedMask = 0, appliedMaskB = 0;
  const TB = 44, TB_APPLIED = 45;   // second toggle word (desired / applied) in the trainer SAB
  // Game mode, written by the page (homepage.html announceMode) into T32[56]: 0 not chosen yet, 1 Story Mode, 2 Sandbox, 3 Sandbox on env_test.
  // In Story Mode the trainer is passive: no sandbox session restore (it teleported the player to the saved sandbox spot and re-applied stored cheats while the
  // story script was setting the game up), no stored toggles, no aim-reticle overlay. Cheats still work when asked for through the menu. Story saves are the
  // game's own: storyAutosaveTick below makes sure they actually happen.
  const T_MODE = 56;
  const N_DO_AUTO_SAVE = 49117, N_IS_AUTO_SAVE_IN_PROGRESS = 49122, N_GET_MISSION_FLAG = 48822, N_GET_IS_AUTO_SAVE_OFF = 49119,
        N_DID_SAVE_COMPLETE_SUCCESSFULLY = 49068, N_IS_CUTSCENE_ACTIVE = 45499, N_IS_PLAYER_SWITCH_IN_PROGRESS = 58146, N_IS_SCREEN_FADED_OUT = 45108,
        N_IS_PLAYER_BEING_ARRESTED = 56437, N_IS_PLAYER_CONTROL_ON = 56428, N_GET_IS_DISPLAYING_SAVE_MESSAGE = 49120;
  const N_GET_ENTITY_MODEL = 46020, N_SET_ENTITY_HEADING = 46212, N_IS_MODEL_A_VEHICLE = 58033;
  const N_HAS_CODE_REQUESTED_AUTOSAVE = 49124, N_CLEAR_CODE_REQUESTED_AUTOSAVE = 49126, N_DOES_SCRIPT_EXIST = 57017, N_SCRIPT_THREADS_BY_HASH = 57041;
  const storyMode = () => !!T32 && Atomics.load(T32, T_MODE) === 1;
  const modeKnown = () => !!T32 && Atomics.load(T32, T_MODE) !== 0;
  let lastCrashThroughMs = 0, diagPrevSpeed = 0, diagLogged = 0, brakeHeldTicks = 0, lastBrakeMs = 0, cachedPlayer = -1, lastSuperJumpMs = 0, lastAimDrawMs = 0, aimShotT = -1e9, aimHitT = -1e9, aimKillT = -1e9, aimPrevShoot = false, aimLastEnt = 0, aimLastEntT = -1e9, aimHitEnt = 0, aimHitWatch = 0;
  let rainbowHue = 0, lastPowerVeh = 0, lastInvisVeh = 0, lastAntiGravVeh = 0;
  function hsvToRgb(h, sat, val) {
    const c = val * sat, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = val - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  let pendingModel = 0, pendingKind = "", pendingFrames = 0, pendingLabel = "", pendingStyle = 0;
  let teleportFrames = 0, tpX = 0, tpY = 0, tpTargetZ = 0;
  let lastGodVeh = 0;

  // Session persistence: position, skin, spawned vehicle and cheat toggles are autosaved to work/session-state.json (via /state) and restored once after boot.
  let restoreStage = -1;      // -1 fetching, 0..4 restoring, 9 done (autosave active)
  let restoreData = null, playingTicks = 0, restoreHeading = null, restoreT0 = 0, tpT0 = 0;
  let savedSkin = "", savedSkinHash = 0, spawnedVeh = 0, spawnedInfo = null;
  let persistErrs = 0, stateFetchT0 = 0, stateFetchTries = 0;
  function fetchSessionState() {
    stateFetchT0 = performance.now(); stateFetchTries++;
    try {
      fetch("/state", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(j => {
        if (restoreStage >= 0) return;
        restoreData = (j && j.v === 1 && isFinite(j.x) && isFinite(j.y) && isFinite(j.z)) ? j : null;
        restoreStage = restoreData ? 0 : 9;
        tlog("[trainer persist] state " + (restoreData ? "loaded" : "none") + " (try " + stateFetchTries + ")");
      }).catch(() => { tlog("[trainer persist] state fetch failed (try " + stateFetchTries + ")"); });
    } catch (e) { tlog("[trainer persist] state fetch threw (try " + stateFetchTries + ")"); }
  }
  fetchSessionState();

  function applyVehicleGod(v, enabled, currentPed) {
    if (!v) return;
    if (enabled) {
      nat(N_SET_ENTITY_INVINCIBLE, "ib", [v, 1]);
      nat(N_SET_ENTITY_PROOFS, "ibbbbbbbb", [v, 1, 1, 1, 1, 1, 1, 1, 1]);
      nat(N_SET_ENTITY_CAN_BE_DAMAGED, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_BE_VISIBLY_DAMAGED, "ib", [v, 0]);
      nat(N_SET_VEHICLE_STRONG, "ib", [v, 1]);
      nat(N_SET_VEHICLE_CAN_BREAK, "ib", [v, 0]);
      nat(N_SET_VEHICLE_TYRES_CAN_BURST, "ib", [v, 0]);
      nat(N_SET_VEHICLE_WHEELS_CAN_BREAK, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_DEFORM_WHEELS, "ib", [v, 0]);
      nat(N_SET_VEHICLE_HAS_UNBREAKABLE_LIGHTS, "ib", [v, 1]);
      nat(N_SET_VEHICLE_EXPLODES_ON_HIGH_EXPLOSION_DAMAGE, "ib", [v, 0]);
      nat(N_SET_DISABLE_EXPLODE_FROM_BODY_DAMAGE_ON_COLLISION, "ib", [v, 1]);
      nat(N_SET_DISABLE_VEHICLE_EXPLOSIONS_DAMAGE, "ib", [v, 1]);
      nat(N_SET_VEHICLE_OCCUPANTS_TAKE_EXPLOSIVE_DAMAGE, "ib", [v, 0]);
      nat(N_SET_VEHICLE_NO_EXPLOSION_DAMAGE_FROM_DRIVER, "ib", [v, 1]);
      nat(N_SET_VEHICLE_ENGINE_CAN_DEGRADE, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_ENGINE_MISSFIRE, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_LEAK_OIL, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_LEAK_PETROL, "ib", [v, 0]);
      nat(N_SET_DISABLE_VEHICLE_PETROL_TANK_DAMAGE, "ib", [v, 1]);
      nat(N_SET_VEHICLE_DAMAGE_SCALE, "if", [v, 0.0]);
      nat(N_SET_VEHICLE_ENGINE_HEALTH, "if", [v, 1000.0]);
      nat(N_SET_VEHICLE_PETROL_TANK_HEALTH, "if", [v, 1000.0]);
      nat(N_SET_VEHICLE_BODY_HEALTH, "if", [v, 1000.0]);
      nat(N_SET_ENTITY_HEALTH, "ii", [v, 1000]);
      nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [v, 0.0]);
      nat(N_DISABLE_VEHICLE_EXPLOSION_BREAK_OFF_PARTS, "", []);
      nat(N_SET_VEHICLE_FIXED, "i", [v]);
      nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [v]);
      nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [v, 1, 1, 0]);
      if (currentPed) {
        nat(N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN, "ib", [currentPed, 0]);
        nat(N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE, "ii", [currentPed, 1]);
      }
    } else {
      nat(N_SET_ENTITY_INVINCIBLE, "ib", [v, 0]);
      nat(N_SET_ENTITY_PROOFS, "ibbbbbbbb", [v, 0, 0, 0, 0, 0, 0, 0, 0]);
      nat(N_SET_ENTITY_CAN_BE_DAMAGED, "ib", [v, 1]);
      nat(N_SET_VEHICLE_CAN_BE_VISIBLY_DAMAGED, "ib", [v, 1]);
      nat(N_SET_VEHICLE_STRONG, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_BREAK, "ib", [v, 1]);
      nat(N_SET_VEHICLE_TYRES_CAN_BURST, "ib", [v, 1]);
      nat(N_SET_VEHICLE_WHEELS_CAN_BREAK, "ib", [v, 1]);
      nat(N_SET_VEHICLE_CAN_DEFORM_WHEELS, "ib", [v, 1]);
      nat(N_SET_VEHICLE_HAS_UNBREAKABLE_LIGHTS, "ib", [v, 0]);
      nat(N_SET_VEHICLE_EXPLODES_ON_HIGH_EXPLOSION_DAMAGE, "ib", [v, 1]);
      nat(N_SET_DISABLE_EXPLODE_FROM_BODY_DAMAGE_ON_COLLISION, "ib", [v, 0]);
      nat(N_SET_DISABLE_VEHICLE_EXPLOSIONS_DAMAGE, "ib", [v, 0]);
      nat(N_SET_VEHICLE_OCCUPANTS_TAKE_EXPLOSIVE_DAMAGE, "ib", [v, 1]);
      nat(N_SET_VEHICLE_NO_EXPLOSION_DAMAGE_FROM_DRIVER, "ib", [v, 0]);
      nat(N_SET_VEHICLE_ENGINE_CAN_DEGRADE, "ib", [v, 1]);
      nat(N_SET_VEHICLE_DAMAGE_SCALE, "if", [v, 1.0]);
      if (currentPed) {
        nat(N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN, "ib", [currentPed, 1]);
        nat(N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE, "ii", [currentPed, 0]);
      }
    }
  }

  function applyAlgerianVehicleStyling(veh, styleId) {
    if (!veh || !styleId) return;
    try {
      switch (styleId) {
        case 1: // Police Algérienne (DGSN / Sûreté Nationale)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 255, 255, 255]); // Blanc pur
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 0, 42, 110]); // Bleu police nationale
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "POLICE17"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]); // Enable lightbar
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 2, 0]); // Enable bullbar
          break;
        case 2: // Gendarmerie Nationale 4x4 (Granger / Land Cruiser)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 18, 55, 28]); // Vert gendarmerie
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 245, 245, 245]); // Blanc
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "GEND 16"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 3]); // Light smoke
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]);
          break;
        case 3: // Gendarmerie Mesa 4x4
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 18, 55, 28]);
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 245, 245, 245]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "GN-0016"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 3]);
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]);
          break;
        case 4: // B.R.I. Algérie Tactical
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 12, 12, 14]); // Midnight tactical black
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 10, 10, 10]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "BRI 16"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 1]); // Black plate
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 1]); // Pure black limo
          nat(N_SET_VEHICLE_MOD_KIT, "ii", [veh, 0]);
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 18, 1]); // Turbo
          break;
        case 5: // Blindé B.R.I. Riot Van
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 15, 15, 18]); // Armor anthracite
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 10, 10, 10]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "BRI TACT"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 1]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 1]);
          break;
        case 6: // Protection Civile Algérie (14)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 185, 15, 20]); // Rouge Protection Civile
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 255, 255, 255]); // Blanc
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "PC 14 DZ"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]);
          break;
        case 7: // Renault Symbol DZ (Le Roi d'Oran)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 248, 248, 250]); // Blanc Glacier Renault
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 240, 240, 242]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "12331 15"]); // Wilaya 31 Oran
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 3]);
          break;
        case 8: // Dacia Sandero Stepway / Logan DZ
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 20, 50, 110]); // Bleu Cosmos Métallisé
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 30, 30, 35]); // Trim anthracite
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "45616 16"]); // Wilaya 16 Alger
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 3]);
          break;
        case 9: // Renault Clio 4 RS DZ (Sport Hatch)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 255, 210, 0]); // Jaune Sirius Renault Sport
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 10, 10, 10]); // Toit & rétros Noir Brillant
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "00716 18"]); // Wilaya 16 Alger
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 2]); // Dark smoke
          nat(N_SET_VEHICLE_MOD_KIT, "ii", [veh, 0]);
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 18, 1]); // Turbo
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 22, 1]); // Xenon
          break;
        case 10: // Peugeot 208 DZ (Lion d'Alger)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 160, 165, 172]); // Gris Aluminium Métallisé
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 15, 15, 15]); // Noir Perla Nera
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "09916 17"]); // Wilaya 16 Alger
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 2]);
          break;
        case 11: // Toyota Hilux DZ (Guerrier du Sahara 4x4)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 195, 175, 140]); // Desert Sand Beige
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 25, 25, 25]); // Matte black trim
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "08830 12"]); // Wilaya 30 Ouargla (Sahara)
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]); // Roll bar
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 2, 0]); // Fog lights
          break;
        case 12: // Camion Hamoud Boualem (Livraison DZ)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 160, 14, 30]); // Hamoud Rouge
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 245, 240, 225]); // Crème historique
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "HAMOUD16"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          break;
        case 13: // Taxi Algérois (Taxi Service DZ)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 255, 185, 0]); // Jaune Taxi Alger
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 250, 250, 250]); // Blanc
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "TAXI 16"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]); // Taxi sign
          break;
        case 14: // Bus Interurbain DZ (Trans-Algérie Express)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 0, 105, 48]); // Vert National DZ
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 255, 255, 255]); // Blanc pur
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "01116 15"]); // Wilaya 16 Alger
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          break;
        case 15: // Mercedes G-Wagon DZ (Escorte VIP)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 5, 5, 6]); // Obsidian Black
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 5, 5, 6]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "PR 01 DZ"]); // Présidence VIP
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 1]); // Black plate
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 1]); // Limo black
          nat(N_SET_VEHICLE_MOD_KIT, "ii", [veh, 0]);
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 18, 1]); // Turbo
          break;
        case 16: // Scooter DZ (Style 103 / Booster)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 0, 140, 225]); // Bleu méditerranéen
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 250, 250, 250]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "DZ 16 M"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          break;
        case 17: // Dune Buggy Sahara DZ (Grand Erg Occidental)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 215, 100, 20]); // Ocre du Sahara
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 185, 160, 120]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "SAHARA30"]); // Wilaya 30 Ouargla
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          break;
      }
      nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [veh, 0.0]);
      tlog("[trainer] applied algerian style #" + styleId + " to veh=" + veh);
    } catch (e) {
      console.error("[trainer] error applying algerian vehicle styling:", e);
      tlog("[trainer err styling] " + (e.message || e));
    }
  }

  function syncWardrobeState(ped) {
    if (!T32 || !ped) return;
    for (let c = 0; c <= 11; c++) {
      try {
        const maxDraw = nat(N_GET_NUMBER_OF_PED_DRAWABLE_VARIATIONS, "ii", [ped, c]).i;
        const curDraw = nat(N_GET_PED_DRAWABLE_VARIATION, "ii", [ped, c]).i;
        let curTex = 0, maxTex = 0;
        if (curDraw >= 0) {
          curTex = nat(N_GET_PED_TEXTURE_VARIATION, "ii", [ped, c]).i;
          maxTex = nat(N_GET_NUMBER_OF_PED_TEXTURE_VARIATIONS, "iii", [ped, c, curDraw]).i;
        }
        const base = 410 + c * 4;
        T32[base + 0] = curDraw;
        T32[base + 1] = maxDraw;
        T32[base + 2] = curTex;
        T32[base + 3] = maxTex;
      } catch (e) {}
    }
    const propSlots = [0, 1, 2, 6, 7];
    for (let i = 0; i < propSlots.length; i++) {
      const p = propSlots[i];
      try {
        const maxProp = nat(N_GET_NUMBER_OF_PED_PROP_DRAWABLE_VARIATIONS, "ii", [ped, p]).i;
        const curProp = nat(N_GET_PED_PROP_INDEX, "ii", [ped, p]).i;
        let curTex = 0, maxTex = 0;
        if (curProp >= 0) {
          curTex = nat(N_GET_PED_PROP_TEXTURE_INDEX, "ii", [ped, p]).i;
          maxTex = nat(N_GET_NUMBER_OF_PED_PROP_TEXTURE_VARIATIONS, "iii", [ped, p, curProp]).i;
        }
        const base = 460 + i * 4;
        T32[base + 0] = curProp;
        T32[base + 1] = maxProp;
        T32[base + 2] = curTex;
        T32[base + 3] = maxTex;
      } catch (e) {}
    }
    Atomics.add(T32, 400, 1);
  }

  function executeCommand(cmdId, argInt, floats, str, player, ped, veh) {
    switch (cmdId) {
      case 1: // HEAL
        nat(N_SET_ENTITY_HEALTH, "iii", [ped, 200, 0]);
        nat(N_SET_PED_ARMOUR, "ii", [ped, 100]);
        if (veh) {
          nat(N_SET_VEHICLE_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_ENGINE_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_VEHICLE_PETROL_TANK_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_VEHICLE_BODY_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_ENTITY_HEALTH, "ii", [veh, 1000]);
          nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [veh, 0.0]);
          nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [veh, 1, 1, 0]);
        }
        postEngineToast("Heal & Armour Restored");
        break;
      case 2: // WEAPONS
        giveWeapons(ped);
        postEngineToast("All Weapons Equipped");
        break;
      case 3: { // MONEY
        const stats = ["SP0_TOTAL_CASH", "SP1_TOTAL_CASH", "SP2_TOTAL_CASH"];
        for (let i = 0; i < stats.length; i++) {
          nat(N_STAT_SET_INT, "iib", [joaat(stats[i]), 999999999, 1]);
        }
        postEngineToast("Max Cash Added ($999,999,999)");
        break;
      }
      case 4: // CLEAR_WANTED
        nat(N_CLEAR_PLAYER_WANTED_LEVEL, "i", [player]);
        postEngineToast("Wanted Level Cleared");
        break;
      case 5: { // WANTED_UP
        const cur = nat(N_GET_PLAYER_WANTED_LEVEL, "i", [player]).i;
        nat(N_SET_MAX_WANTED_LEVEL, "i", [5]);
        nat(N_SET_PLAYER_WANTED_LEVEL, "iib", [player, Math.min(5, cur + 1), 0]);
        nat(N_SET_PLAYER_WANTED_LEVEL_NOW, "ib", [player, 0]);
        postEngineToast("Wanted Level +1");
        break;
      }
      case 6: // WANTED_MAX
        nat(N_SET_MAX_WANTED_LEVEL, "i", [5]);
        nat(N_SET_PLAYER_WANTED_LEVEL, "iib", [player, 5, 0]);
        nat(N_SET_PLAYER_WANTED_LEVEL_NOW, "ib", [player, 0]);
        postEngineToast("5 Stars Active");
        break;
      case 7: // REPAIR
        if (veh) {
          nat(N_SET_VEHICLE_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_ENGINE_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_VEHICLE_PETROL_TANK_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_VEHICLE_BODY_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_ENTITY_HEALTH, "ii", [veh, 1000]);
          nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [veh, 0.0]);
          nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [veh, 1, 1, 0]);
          postEngineToast("Vehicle Repaired & Restored");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 8: // FLIP
        if (veh) {
          nat(N_SET_VEHICLE_ON_GROUND_PROPERLY, "if", [veh, 5.0]);
          postEngineToast("Vehicle Flipped Upright");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 9: // BOOST
        if (veh) {
          nat(N_SET_VEHICLE_FORWARD_SPEED, "if", [veh, 45.0]);
          postEngineToast("Speed Boost +45 m/s");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 10: // TUNE
        if (veh) {
          nat(N_SET_VEHICLE_MOD_KIT, "ii", [veh, 0]);
          for (let t = 0; t < 49; t++) {
            const count = nat(N_GET_NUM_VEHICLE_MODS, "ii", [veh, t]).i;
            if (count > 0) nat(N_SET_VEHICLE_MOD, "iiib", [veh, t, count - 1, 0]);
          }
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 18, 1]);
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 22, 1]);
          nat(N_SET_VEHICLE_FIXED, "i", [veh]);
          postEngineToast("Vehicle Max Tuned");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 11: // PAINT
        if (veh) {
          const c1 = Math.floor(Math.random() * 160);
          const c2 = Math.floor(Math.random() * 160);
          nat(N_SET_VEHICLE_COLOURS, "iii", [veh, c1, c2]);
          postEngineToast("Random Paint Applied");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 12: { // TELEPORT_WAYPOINT
        const blip = nat(N_GET_FIRST_BLIP_INFO_ID, "i", [8]).i;
        if (blip && nat(N_DOES_BLIP_EXIST, "i", [blip]).i) {
          const c = nat(N_GET_BLIP_INFO_ID_COORD, "i", [blip]).v;
          tpX = c[0];
          tpY = c[1];
          tpTargetZ = 0;
          teleportFrames = 1;
          nat(N_SET_ENTITY_COORDS, "ivbbbb", [veh || ped, tpX, tpY, 700.0, 0, 0, 0, 1]);
          postEngineToast("Teleporting to Waypoint");
        } else {
          postEngineToast("No Waypoint Set on Map");
        }
        break;
      }
      case 13: { // TELEPORT_COORDS
        tpX = floats[0];
        tpY = floats[1];
        tpTargetZ = floats[2] || 0;
        nat(N_SET_ENTITY_COORDS, "ivbbbb", [veh || ped, tpX, tpY, tpTargetZ || 700.0, 0, 0, 0, 1]);
        if (!tpTargetZ) teleportFrames = 1;
        postEngineToast("Teleporting to " + (str || "location"));
        break;
      }
      case 14: // TIME
        nat(N_SET_CLOCK_TIME, "iii", [argInt, 0, 0]);
        postEngineToast("World Time: " + (str || (argInt + ":00")));
        break;
      case 15: // WEATHER
        nat(N_SET_WEATHER_TYPE_NOW_PERSIST, "s", [str || "CLEAR"]);
        postEngineToast("Weather: " + (str || "CLEAR"));
        break;
      case 16: // SPAWN_VEHICLE
      case 17: { // SPAWN_SKIN
        const targetModel = str;
        const modelHash = joaat(targetModel);
        nat(N_REQUEST_MODEL, "i", [modelHash]);
        pendingModel = modelHash;
        pendingKind = (cmdId === 16 ? "spawn_vehicle" : "spawn_skin");
        pendingStyle = (cmdId === 16 ? (argInt | 0) : 0);
        pendingFrames = 0;
        pendingLabel = targetModel;
        break;
      }
      case 18: { // CUSTOMIZE_COMPONENT
        const compId = (argInt >> 16) & 0xffff;
        const action = argInt & 0xffff;
        if (action === 8) { // Set exact drawable index
          const maxDraw = nat(N_GET_NUMBER_OF_PED_DRAWABLE_VARIATIONS, "ii", [ped, compId]).i;
          const targetDraw = Math.max(0, Math.min(Math.round(floats[0]), maxDraw > 0 ? maxDraw - 1 : 0));
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, compId, targetDraw, 0, 0]);
          postEngineToast((str || ("Comp " + compId)) + ": #" + targetDraw + "/" + (maxDraw - 1));
        } else if (action === 15) { // Set exact texture index
          const curDraw = nat(N_GET_PED_DRAWABLE_VARIATION, "ii", [ped, compId]).i;
          const maxTex = nat(N_GET_NUMBER_OF_PED_TEXTURE_VARIATIONS, "iii", [ped, compId, curDraw]).i;
          const targetTex = Math.max(0, Math.min(Math.round(floats[0]), maxTex > 0 ? maxTex - 1 : 0));
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, compId, curDraw, targetTex, 0]);
          postEngineToast((str || ("Comp " + compId)) + " Tex: #" + targetTex + "/" + (maxTex - 1));
        } else
        if (action === 6) { // Randomize all clothes
          nat(N_SET_PED_RANDOM_COMPONENT_VARIATION, "ib", [ped, 0]);
          postEngineToast("Outfit Randomized");
        } else if (action === 7) { // Reset default clothes
          nat(N_SET_PED_DEFAULT_COMPONENT_VARIATION, "i", [ped]);
          nat(N_CLEAR_ALL_PED_PROPS, "i", [ped]);
          postEngineToast("Clothes Reset to Default");
        } else if (action === 4) { // Bare torso / Remove shirt
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 11, 15, 0, 0]);
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 8, 15, 0, 0]);
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 3, 15, 0, 0]);
          postEngineToast("Shirt Removed (Bare Torso)");
        } else if (action === 9) { // Put shirt on
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 11, 0, 0, 0]);
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 8, 0, 0, 0]);
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 3, 0, 0, 0]);
          postEngineToast("Shirt Put On");
        } else if (action === 5) { // Boxers / Underwear
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 4, 0, 0, 0]);
          postEngineToast("Underwear / Boxers On");
        } else if (action === 10) { // Barefoot / Default Shoes
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 6, 0, 0, 0]);
          postEngineToast("Barefoot / Shoes Default");
        } else if (action === 11) { // Remove mask / beard
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 1, 0, 0, 0]);
          postEngineToast("Mask / Beard Cleared");
        } else if (action === 12) { // Remove armor
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 9, 0, 0, 0]);
          postEngineToast("Body Armor Cleared");
        } else if (action === 13) { // Remove bag
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 5, 0, 0, 0]);
          postEngineToast("Bag Cleared");
        } else if (action === 14) { // Remove accessories
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 7, 0, 0, 0]);
          postEngineToast("Accessories Cleared");
        } else {
          const maxDraw = nat(N_GET_NUMBER_OF_PED_DRAWABLE_VARIATIONS, "ii", [ped, compId]).i;
          const curDraw = nat(N_GET_PED_DRAWABLE_VARIATION, "ii", [ped, compId]).i;
          const curTex = nat(N_GET_PED_TEXTURE_VARIATION, "ii", [ped, compId]).i;

          if (action === 1) { // Next drawable
            const nextDraw = maxDraw > 0 ? (curDraw + 1) % maxDraw : 0;
            nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, compId, nextDraw, 0, 0]);
            postEngineToast((str || "Component " + compId) + ": #" + nextDraw + "/" + (maxDraw - 1));
          } else if (action === 2) { // Prev drawable
            const prevDraw = maxDraw > 0 ? (curDraw - 1 + maxDraw) % maxDraw : 0;
            nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, compId, prevDraw, 0, 0]);
            postEngineToast((str || "Component " + compId) + ": #" + prevDraw + "/" + (maxDraw - 1));
          } else if (action === 3) { // Next texture
            const maxTex = nat(N_GET_NUMBER_OF_PED_TEXTURE_VARIATIONS, "iii", [ped, compId, curDraw]).i;
            const nextTex = maxTex > 0 ? (curTex + 1) % maxTex : 0;
            nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, compId, curDraw, nextTex, 0]);
            postEngineToast((str || "Component " + compId) + " Tex: #" + nextTex + "/" + (maxTex - 1));
          }
        }
        syncWardrobeState(ped);
        break;
      }
      case 19: { // CUSTOMIZE_PROP
        const propId = (argInt >> 16) & 0xffff;
        const action = argInt & 0xffff;
        if (action === 8) { // Set exact prop index
          const maxProp = nat(N_GET_NUMBER_OF_PED_PROP_DRAWABLE_VARIATIONS, "ii", [ped, propId]).i;
          const targetProp = Math.round(floats[0]);
          if (targetProp < 0) {
            nat(N_CLEAR_PED_PROP, "ii", [ped, propId]);
            postEngineToast((str || ("Prop " + propId)) + ": None");
          } else {
            const clamped = Math.max(0, Math.min(targetProp, maxProp > 0 ? maxProp - 1 : 0));
            nat(N_SET_PED_PROP_INDEX, "iiiib", [ped, propId, clamped, 0, 1]);
            postEngineToast((str || ("Prop " + propId)) + ": #" + clamped + "/" + (maxProp - 1));
          }
        } else if (action === 15) { // Set exact prop texture
          const curProp = nat(N_GET_PED_PROP_INDEX, "ii", [ped, propId]).i;
          if (curProp >= 0) {
            const maxTex = nat(N_GET_NUMBER_OF_PED_PROP_TEXTURE_VARIATIONS, "iii", [ped, propId, curProp]).i;
            const targetTex = Math.max(0, Math.min(Math.round(floats[0]), maxTex > 0 ? maxTex - 1 : 0));
            nat(N_SET_PED_PROP_INDEX, "iiiib", [ped, propId, curProp, targetTex, 1]);
            postEngineToast((str || ("Prop " + propId)) + " Tex: #" + targetTex + "/" + (maxTex - 1));
          }
        } else
        if (action === 5) { // Clear all props
          nat(N_CLEAR_ALL_PED_PROPS, "i", [ped]);
          postEngineToast("All Props Cleared");
        } else if (action === 6) { // Randomize props
          nat(N_SET_PED_RANDOM_PROPS, "i", [ped]);
          postEngineToast("Props Randomized");
        } else if (action === 4) { // Clear specific prop
          nat(N_CLEAR_PED_PROP, "ii", [ped, propId]);
          postEngineToast((str || "Prop " + propId) + ": Cleared");
        } else {
          const maxProp = nat(N_GET_NUMBER_OF_PED_PROP_DRAWABLE_VARIATIONS, "ii", [ped, propId]).i;
          const curProp = nat(N_GET_PED_PROP_INDEX, "ii", [ped, propId]).i;
          const curTex = (curProp >= 0) ? nat(N_GET_PED_PROP_TEXTURE_INDEX, "ii", [ped, propId]).i : 0;

          if (action === 1) { // Next prop
            let nextProp = curProp + 1;
            if (nextProp >= maxProp) nextProp = -1;
            if (nextProp === -1) {
              nat(N_CLEAR_PED_PROP, "ii", [ped, propId]);
              postEngineToast((str || "Prop " + propId) + ": None");
            } else {
              nat(N_SET_PED_PROP_INDEX, "iiiib", [ped, propId, nextProp, 0, 1]);
              postEngineToast((str || "Prop " + propId) + ": #" + nextProp + "/" + (maxProp - 1));
            }
          } else if (action === 2) { // Prev prop
            let prevProp = curProp - 1;
            if (prevProp < -1) prevProp = maxProp - 1;
            if (prevProp === -1) {
              nat(N_CLEAR_PED_PROP, "ii", [ped, propId]);
              postEngineToast((str || "Prop " + propId) + ": None");
            } else {
              nat(N_SET_PED_PROP_INDEX, "iiiib", [ped, propId, prevProp, 0, 1]);
              postEngineToast((str || "Prop " + propId) + ": #" + prevProp + "/" + (maxProp - 1));
            }
          } else if (action === 3) { // Next texture
            if (curProp >= 0) {
              const maxTex = nat(N_GET_NUMBER_OF_PED_PROP_TEXTURE_VARIATIONS, "iii", [ped, propId, curProp]).i;
              const nextTex = maxTex > 0 ? (curTex + 1) % maxTex : 0;
              nat(N_SET_PED_PROP_INDEX, "iiiib", [ped, propId, curProp, nextTex, 1]);
              postEngineToast((str || "Prop " + propId) + " Tex: #" + nextTex + "/" + (maxTex - 1));
            } else {
              postEngineToast("No prop equipped");
            }
          }
        }
        syncWardrobeState(ped);
        break;
      }
      case 20: // ARMOUR
        nat(N_SET_PED_ARMOUR, "ii", [ped, 100]);
        postEngineToast("Full Body Armour (100%)");
        break;
      case 21: // PARACHUTE
        nat(N_GIVE_WEAPON_TO_PED, "iiibb", [ped, joaat("GADGET_PARACHUTE"), 1, 0, 1]);
        postEngineToast("Parachute Equipped");
        break;
      case 22: // CLEAN_PED
        nat(N_CLEAR_PED_BLOOD_DAMAGE_BY_ZONE, "ii", [ped, 0]);
        nat(N_CLEAR_PED_WETNESS, "i", [ped]);
        nat(N_CLEAR_PED_ENV_DIRT, "i", [ped]);
        postEngineToast("Player Cleaned (Blood & Dirt Removed)");
        break;
      case 23: { // CLEAR_AREA
        const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
        nat(N_CLEAR_AREA, "vfibbbbb", [c[0], c[1], c[2], 120.0, 1, 0, 0, 0]);
        postEngineToast("Area Cleared (Traffic & Peds)");
        break;
      }
      case 24: // RAGDOLL
        nat(N_SET_PED_TO_RAGDOLL, "iiiii", [ped, 4000, 4000, 0, 1, 1]);
        postEngineToast("Ragdoll Activated");
        break;
      case 25: // SUICIDE
        nat(N_SET_ENTITY_HEALTH, "iii", [ped, 0, 0]);
        postEngineToast("Wasted");
        break;
      case 26: // REMOVE_WEAPONS
        nat(N_REMOVE_ALL_PED_WEAPONS, "i", [ped]);
        postEngineToast("All Weapons Removed");
        break;
      case 27: // VEH_JUMP
        if (veh) {
          nat(N_SET_ENTITY_VELOCITY, "iv", [veh, 0.0, 0.0, 14.0]);
          postEngineToast("Bunny Hop Jump!");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 28: // VEH_STOP
        if (veh) {
          nat(N_SET_ENTITY_VELOCITY, "iv", [veh, 0.0, 0.0, 0.0]);
          nat(N_SET_VEHICLE_FORWARD_SPEED, "if", [veh, 0.0]);
          postEngineToast("Emergency Brake: Stopped");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 29: // VEH_CLEAN
        if (veh) {
          nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [veh, 0.0]);
          nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]);
          postEngineToast("Vehicle Cleaned & Washed");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 30: // VEH_DOORS
        if (veh) {
          if (argInt === 1) {
            for (let d = 0; d < 6; d++) nat(N_SET_VEHICLE_DOOR_OPEN, "iibb", [veh, d, 0, 0]);
            postEngineToast("Vehicle Doors Opened");
          } else {
            nat(N_SET_VEHICLE_DOORS_SHUT, "ib", [veh, 0]);
            postEngineToast("Vehicle Doors Closed");
          }
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 31: // VEH_EXPLODE
        if (veh) {
          nat(N_EXPLODE_VEHICLE, "ibb", [veh, 1, 0]);
          postEngineToast("Vehicle Exploded");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      // ---- Menu redesign commands (32+) ----
      case 32: { // WANTED_SET: argInt = stars 0..5
        const n = Math.max(0, Math.min(5, argInt | 0));
        nat(N_SET_MAX_WANTED_LEVEL, "i", [5]);
        if (n === 0) {
          nat(N_CLEAR_PLAYER_WANTED_LEVEL, "i", [player]);
        } else {
          nat(N_SET_PLAYER_WANTED_LEVEL, "iib", [player, n, 0]);
          nat(N_SET_PLAYER_WANTED_LEVEL_NOW, "ib", [player, 0]);
        }
        postEngineToast("Wanted level: " + n + (n === 1 ? " star" : " stars"));
        break;
      }
      case 33: { // GIVE_WEAPON: str = WEAPON_xxx
        const ok = giveWeaponIfValid(ped, str, 500, true);
        postEngineToast(ok ? ("Weapon: " + str.replace("WEAPON_", "")) : ("Weapon not available: " + str.replace("WEAPON_", "")));
        break;
      }
      case 34: { // GIVE_WEAPON_SET: argInt = category index, -1 = refill all ammo
        if (argInt < 0) {
          let n = 0;
          for (const set of WEAPON_SETS) for (const w of set) {
            const h = joaat(w);
            if (nat(N_IS_WEAPON_VALID, "i", [h]).i && nat(N_HAS_PED_GOT_WEAPON, "ii", [ped, h]).i) { nat(N_SET_PED_AMMO, "iii", [ped, h, 9999]); n++; }
          }
          postEngineToast("Ammo refilled on " + n + " weapons");
        } else {
          const set = WEAPON_SETS[argInt] || [];
          let n = 0;
          for (const w of set) if (giveWeaponIfValid(ped, w, 500, false)) n++;
          postEngineToast("Gave " + n + " weapons");
        }
        break;
      }
      case 35: { // TELEPORT_FORWARD: argInt metres (negative = backwards)
        const ent = veh || ped;
        const o = nat(N_GET_OFFSET_FROM_ENTITY_IN_WORLD_COORDS, "iv", [ent, 0.0, argInt, 0.0]).v;
        nat(N_SET_ENTITY_COORDS, "ivbbbb", [ent, o[0], o[1], o[2] + 0.4, 0, 0, 0, 1]);
        postEngineToast("Teleported " + argInt + " m");
        break;
      }
      case 36: { // TELEPORT_UP: argInt metres; floats[0] = 1 -> add a parachute (skydive)
        const ent = veh || ped;
        const c = nat(N_GET_ENTITY_COORDS, "ib", [ent, 1]).v;
        nat(N_SET_ENTITY_COORDS, "ivbbbb", [ent, c[0], c[1], c[2] + argInt, 0, 0, 0, 1]);
        if (floats[0] === 1) nat(N_GIVE_WEAPON_TO_PED, "iiibb", [ped, joaat("GADGET_PARACHUTE"), 1, 0, 1]);
        postEngineToast(floats[0] === 1 ? "Skydive! Parachute equipped" : ("Moved " + (argInt >= 0 ? "up " : "down ") + Math.abs(argInt) + " m"));
        break;
      }
      case 37: // VEH_BOOST_N: argInt = forward speed m/s
        if (veh) { nat(N_SET_VEHICLE_FORWARD_SPEED, "if", [veh, argInt]); postEngineToast("Boost " + argInt + " m/s"); }
        else postEngineToast("Not in a vehicle");
        break;
      case 38: // VEH_COLOR: floats = r,g,b
        if (veh) {
          const r = floats[0] | 0, g = floats[1] | 0, b = floats[2] | 0;
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, r, g, b]);
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, r, g, b]);
          postEngineToast("Paint: " + (str || (r + "," + g + "," + b)));
        } else postEngineToast("Not in a vehicle");
        break;
      case 39: // VEH_NEON: argInt 1 on / 0 off, floats = r,g,b
        if (veh) {
          if (argInt) nat(N_SET_VEHICLE_NEON_COLOUR, "iiii", [veh, floats[0] | 0, floats[1] | 0, floats[2] | 0]);
          for (let i = 0; i < 4; i++) nat(N_SET_VEHICLE_NEON_ENABLED, "iib", [veh, i, argInt ? 1 : 0]);
          postEngineToast(argInt ? ("Neon: " + (str || "on")) : "Neon off");
        } else postEngineToast("Not in a vehicle");
        break;
      case 40: // VEH_TYRES: argInt 1 burst / 0 fix
        if (veh) {
          for (let i = 0; i < 8; i++) {
            if (argInt) nat(N_SET_VEHICLE_TYRE_BURST, "iibf", [veh, i, 1, 1000.0]);
            else nat(N_SET_VEHICLE_TYRE_FIXED, "ii", [veh, i]);
          }
          postEngineToast(argInt ? "Tyres burst" : "Tyres fixed");
        } else postEngineToast("Not in a vehicle");
        break;
      case 41: // VEH_ROOF: argInt 1 lower / 0 raise
        if (veh) {
          if (argInt) nat(N_LOWER_CONVERTIBLE_ROOF, "ib", [veh, 0]); else nat(N_RAISE_CONVERTIBLE_ROOF, "ib", [veh, 0]);
          postEngineToast(argInt ? "Roof lowering" : "Roof raising");
        } else postEngineToast("Not in a vehicle");
        break;
      case 42: // VEH_LOCK: argInt 2 lock / 1 unlock
        if (veh) { nat(N_SET_VEHICLE_DOORS_LOCKED, "ii", [veh, argInt]); postEngineToast(argInt === 2 ? "Doors locked" : "Doors unlocked"); }
        else postEngineToast("Not in a vehicle");
        break;
      case 43: { // AIRSTRIKE: ring of explosions 25..45 m around the player
        const c = nat(N_GET_ENTITY_COORDS, "ib", [veh || ped, 1]).v;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2, r = 25 + (i % 3) * 10;
          nat(N_ADD_EXPLOSION, "vifbbfb", [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2], 0, 1.0, 1, 0, 0.6, 0]);
        }
        postEngineToast("Airstrike!");
        break;
      }
      case 44: { // SPAWN_PED: str = model, argInt: 1 bodyguard, 2 hostile, 0 neutral
        const mh = joaat(str);
        nat(N_REQUEST_MODEL, "i", [mh]);
        if (!pendingModel) {
          pendingModel = mh; pendingKind = "spawn_ped"; pendingStyle = argInt | 0; pendingFrames = 0; pendingLabel = str;
        } else postEngineToast("Busy loading another model");
        break;
      }
      case 45: { // LAUNCH_UP: argInt = vertical speed
        const ent = veh || ped;
        nat(N_SET_ENTITY_VELOCITY, "iv", [ent, 0.0, 0.0, argInt]);
        postEngineToast("Launch!");
        break;
      }
      case 46: { // HIJACK_NEAREST: put the player into the closest vehicle
        const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
        const v = nat(N_GET_CLOSEST_VEHICLE, "vfii", [c[0], c[1], c[2], 60.0, 0, 70]).i;
        if (v) { nat(N_SET_PED_INTO_VEHICLE, "iii", [ped, v, -1]); postEngineToast("Entered nearest vehicle"); }
        else postEngineToast("No vehicle within 60 m");
        break;
      }
      case 47: // GAME_SPEED: floats[0] = time scale
        nat(N_SET_TIME_SCALE, "f", [floats[0]]);
        postEngineToast("Game speed x" + (Math.round(floats[0] * 100) / 100));
        break;
      case 48: // PLATE: str
        if (veh) { nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, str || "GTA V"]); postEngineToast("Plate: " + (str || "GTA V")); }
        else postEngineToast("Not in a vehicle");
        break;
      case 49: // WINDOW_TINT: argInt 0..6
        if (veh) { nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, argInt]); postEngineToast("Window tint " + argInt); }
        else postEngineToast("Not in a vehicle");
        break;
      case 51: // SAVE_NOW: Story Mode save on request (the Cmd+S / Ctrl+S / F9 shortcut and the Settings button); queued until the game allows it
        if (!storyMode()) { postEngineToast("Saving is for Story Mode"); break; }
        storyWantSave(true, 240000, "shortcut");
        if (storySave(true)) { saveWantUntil = 0; postEngineToast("Saving..."); }
        else postEngineToast("Save queued: " + storyLastWhy + ". It saves as soon as that ends.");
        break;
      case 50: // VEH_ENGINE: argInt 1 on / 0 off
        if (veh) { nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [veh, argInt ? 1 : 0, 1, 0]); postEngineToast(argInt ? "Engine on" : "Engine off"); }
        else postEngineToast("Not in a vehicle");
        break;
      case 52: // PROP_COURSE: 0 remove, 2 back to the start (timer reset), 3 back to the last checkpoint. The course itself arrives through the bulk channel.
        courseCommand(argInt, ped, veh);
        break;
    }
  }


  // ---- Prop courses (mods/<id>/course.json, format 2) ----------------------------------------------------------------------------------------------------------
  // The mod's page script sends the whole course as JSON through the bulk channel (GTAV.sendData in homepage.html, SAB bytes 8192..):
  // { kind: "course", vehicle: ["model", "fallback"], start: [x, y, z, heading], models: { key: ["model", "fallback", ...] },
  //   cps: [[x, y, z, heading, radius], ...],                  checkpoint 0 is the start pad, reaching the last one finishes the course
  //   pieces: [{ s, k: "road", m, a: [x, y, z], h, p, r, l, w },   strip whose top surface starts at a (centre line): heading h, pitch p (nose up), roll r (right edge down),
  //            { s, k: "block", m, c: [x, y, z], h, p, r },       length l, width w, tiled with model m at its real size / one model centred on c
  //            { s, k: "deco", m, c: [x, y, z], h, p, r }] }      decoration standing on c (bottom centre of its box), the model's own facing turned to h
  // A model key whose models are all missing in this game is dropped with its pieces; "sizes": { model: [x, y, z] } is the fallback when the game cannot measure one.
  // Pieces of stage s lie between checkpoint s and s + 1. Only stages cur-1 .. cur+2 exist at a time, so a course can be far bigger than the object pool.
  // Falling below the current stages, or command 52 mode 3 (R in the mod), puts the car back on the last checkpoint.
  const N_GET_MODEL_DIMENSIONS = 49166, N_SET_ENTITY_COORDS_NO_OFFSET = 46208, N_DELETE_OBJECT = 54098;
  const N_IS_ENTITY_IN_WATER = 46098, N_SET_ENTITY_LOD_DIST = 46256, N_DRAW_MARKER = 46537, N_SET_GAMEPLAY_CAM_RELATIVE_HEADING = 45136;
  const BULK_STATE = 2040, BULK_LEN = 2041, BULK_BYTE = 8192;   // page -> trainer: state 1 chunk, 2 last chunk, trainer sets 0 when read
  const CHUD = 2030;   // trainer -> page: state (0 none, 1 building, 2 running, 3 finished), checkpoint, last checkpoint, falls, elapsed ms, props alive, props total
  const COURSE_WINDOW_BACK = 1, COURSE_WINDOW_AHEAD = 2, COURSE_SPAWN_PER_TICK = 6, COURSE_DELETE_PER_TICK = 12;
  let bulkParts = [], course = null;

  function bulkTick() {
    const st = Atomics.load(T32, BULK_STATE);
    if (st !== 1 && st !== 2) return;
    const len = Math.max(0, Math.min(T32[BULK_LEN] | 0, TU8.length - BULK_BYTE));
    bulkParts.push(TU8.slice(BULK_BYTE, BULK_BYTE + len));
    Atomics.store(T32, BULK_STATE, 0);
    if (st !== 2) return;
    let total = 0, o = 0;
    for (const b of bulkParts) total += b.length;
    const all = new Uint8Array(total);
    for (const b of bulkParts) { all.set(b, o); o += b.length; }
    bulkParts = [];
    let data;
    try { data = JSON.parse(dec.decode(all)); } catch (e) { tlog("[trainer course] bad data (" + total + " bytes): " + e.message); postEngineToast("Course data could not be read"); return; }
    tlog("[trainer course] received " + total + " bytes, kind " + (data && data.kind));
    if (data && data.kind === "course") courseLoad(data);
  }

  const firstModel = (names) => { for (const n of [].concat(names || [])) { const h = joaat(String(n)); if (nat(N_IS_MODEL_IN_CDIMAGE, "i", [h]).i !== 0) return { h, name: String(n) }; } return null; };
  const v3 = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const rad = Math.PI / 180;

  function courseHud(state) {
    const c = course;
    T32[CHUD] = state; T32[CHUD + 1] = c ? c.cur : 0; T32[CHUD + 2] = c ? c.cps.length - 1 : 0; T32[CHUD + 3] = c ? c.falls : 0;
    T32[CHUD + 4] = c && c.t0 ? ((c.tEnd || Date.now()) - c.t0) | 0 : 0; T32[CHUD + 5] = c ? c.alive : 0; T32[CHUD + 6] = c ? c.tiles.length : 0;
  }

  function courseDeleteTile(t) {
    const o = t.o; t.o = 0;
    if (!o) return;
    try {
      nat(N_FREEZE_ENTITY_POSITION, "ib", [o, 0]);
      nat(N_DELETE_OBJECT, "P", [o]);
      if (nat(N_DOES_ENTITY_EXIST, "i", [o]).i) { nat(N_SET_ENTITY_COORDS, "ivbbbb", [o, 0, 0, -900.0, 0, 0, 0, 1]); nat(N_SET_ENTITY_AS_NO_LONGER_NEEDED, "i", [o]); }
    } catch (e) {}
    course.alive--;
  }

  function courseClear() {
    if (course) {
      for (const t of course.tiles) courseDeleteTile(t);
      for (const h of Object.keys(course.mdl)) nat(N_SET_MODEL_AS_NO_LONGER_NEEDED, "i", [h | 0]);
      if (course.held) nat(N_FREEZE_ENTITY_POSITION, "ib", [course.held, 0]);
    }
    course = null; bulkParts = [];
    courseHud(0);
  }

  function courseLoad(data) {
    courseClear();
    const keys = {}, mdl = {}, missing = [];
    for (const [key, names] of Object.entries(data.models || {})) {
      const m = firstModel(names);
      if (!m) { missing.push(key); continue; }
      keys[key] = m.h; mdl[m.h] = { name: m.name, sP: 1, sR: 1, calP: false, calR: false, failed: 0 };
      nat(N_REQUEST_MODEL, "i", [m.h]);
    }
    const cps = (data.cps || []).map((c) => [+c[0], +c[1], +c[2], +c[3] || 0, +c[4] || 10]);
    if (cps.length < 2) { postEngineToast("Course has no checkpoints"); return; }
    const veh = firstModel(data.vehicle);
    course = { data, keys, mdl, missing, cps, phase: "models", frames: 0, tiles: [], stages: [], built: [], alive: 0, cur: 0, falls: 0, t0: 0, tEnd: 0,
      vehicle: veh ? veh.h : 0, held: 0, holdCp: -1, lastVeh: 0, guard: 0, fallZ: [] };
    tlog("[trainer course] loading: " + Object.keys(keys).length + " models, " + (data.pieces || []).length + " pieces, " + cps.length + " checkpoints");
    postEngineToast("Building course...");
    courseHud(1);
  }

  // Turns the pieces into tiles once every model is loaded and measured.
  function courseExpand() {
    const c = course, nStages = c.cps.length - 1;
    for (let s = 0; s < nStages; s++) { c.stages.push([]); c.fallZ.push(Math.min(c.cps[s][2], c.cps[s + 1][2])); }
    for (const pc of c.data.pieces || []) {
      const mh = c.keys[pc.m], md = c.mdl[mh];
      if (!md) continue;
      const s = Math.max(0, Math.min(nStages - 1, pc.s | 0));
      const h = (+pc.h || 0) * rad, p = (+pc.p || 0) * rad, r = (+pc.r || 0) * rad;
      const f = [-Math.sin(h) * Math.cos(p), Math.cos(h) * Math.cos(p), Math.sin(p)];
      const r0 = [Math.cos(h), Math.sin(h), 0];
      const u0 = [r0[1] * f[2] - r0[2] * f[1], r0[2] * f[0] - r0[0] * f[2], r0[0] * f[1] - r0[1] * f[0]];
      const right = [r0[0] * Math.cos(r) - u0[0] * Math.sin(r), r0[1] * Math.cos(r) - u0[1] * Math.sin(r), r0[2] * Math.cos(r) - u0[2] * Math.sin(r)];
      const base = { s, mh, yaw: (+pc.h || 0) + (md.longY ? 0 : 90), pp: +pc.p || 0, pr: +pc.r || 0, f, right, o: 0 };
      if (pc.k === "deco") {
        c.tiles.push(Object.assign({}, base, { at: [+pc.c[0], +pc.c[1], +pc.c[2]], top: false, bottom: true, raw: true, yaw: +pc.h || 0 }));
      } else if (pc.k === "block") {
        c.tiles.push(Object.assign({}, base, { at: [+pc.c[0], +pc.c[1], +pc.c[2]], top: false }));
        c.fallZ[s] = Math.min(c.fallZ[s], +pc.c[2]);
      } else {
        const l = Math.max(0.5, +pc.l || md.L), w = Math.max(0.5, +pc.w || md.W);
        const n = Math.max(1, Math.ceil(l / md.L - 0.02)), m = Math.max(1, Math.ceil(w / md.W - 0.02));
        for (let i = 0; i < n; i++) {
          const u = n === 1 ? l / 2 : md.L / 2 + i * (l - md.L) / (n - 1);
          for (let j = 0; j < m; j++) {
            const v = m === 1 ? 0 : -w / 2 + md.W / 2 + j * (w - md.W) / (m - 1);
            const at = v3(v3(pc.a, f, u), right, v);
            c.tiles.push(Object.assign({}, base, { at, top: true }));
          }
        }
        c.fallZ[s] = Math.min(c.fallZ[s], +pc.a[2], +pc.a[2] + Math.sin(p) * l);
      }
    }
    for (let i = 0; i < c.tiles.length; i++) c.stages[c.tiles[i].s].push(i);
    for (let s = 0; s < nStages; s++) c.built.push(0);
    tlog("[trainer course] " + c.tiles.length + " tiles in " + nStages + " stages");
  }

  function courseMeasureAxes(o, md) {
    const O = nat(N_GET_ENTITY_COORDS, "ib", [o, 0]).v;
    const at = (x, y) => { const w = nat(N_GET_OFFSET_FROM_ENTITY_IN_WORLD_COORDS, "ifff", [o, x, y, 0]).v; return [(w[0] - O[0]) / 10, (w[1] - O[1]) / 10, (w[2] - O[2]) / 10]; };
    return md.longY ? { along: at(0, 10), across: at(10, 0) } : { along: at(10, 0), across: at(0, -10) };
  }
  function courseRotate(o, t, md) {
    const a = t.pp * md.sP, b = t.pr * md.sR, y = t.raw || md.longY;
    nat(N_SET_ENTITY_ROTATION, "ivib", [o, y ? a : b, y ? b : a, t.yaw, 2, 1]);
  }
  // The engine's sign for pitch and roll is measured on the first tilted tile of each model rather than assumed.
  function courseCalibrate(o, t, md, which) {
    const err = () => { const m = courseMeasureAxes(o, md); let e = 0; for (let k = 0; k < 3; k++) e += Math.abs(m.along[k] - t.f[k]) + Math.abs(m.across[k] - t.right[k]); return e; };
    const e1 = err();
    if (e1 > 0.08) {
      if (which === "P") md.sP = -md.sP; else md.sR = -md.sR;
      courseRotate(o, t, md);
      const e2 = err();
      if (e2 >= e1) { if (which === "P") md.sP = -md.sP; else md.sR = -md.sR; courseRotate(o, t, md); }
      tlog("[trainer course] " + md.name + " " + which + " sign " + (which === "P" ? md.sP : md.sR) + " (error " + e1.toFixed(2) + " / " + e2.toFixed(2) + ")");
    }
    if (which === "P") md.calP = true; else md.calR = true;
  }

  function courseSpawnTile(t) {
    const md = course.mdl[t.mh];
    const o = nat(N_CREATE_OBJECT_NO_OFFSET, "ivbbb", [t.mh, t.at[0], t.at[1], t.at[2], 0, 0, 1]).i;
    if (!o) return false;
    courseRotate(o, t, md);
    if (t.top && t.pp && !md.calP) courseCalibrate(o, t, md, "P");
    if (t.top && t.pr && !md.calR) courseCalibrate(o, t, md, "R");
    // Put the top centre (roads), bottom centre (decorations) or centre (blocks) of the model's box exactly on the target point, whatever the model's pivot is.
    const O = nat(N_GET_ENTITY_COORDS, "ib", [o, 0]).v;
    const M = nat(N_GET_OFFSET_FROM_ENTITY_IN_WORLD_COORDS, "ifff", [o, md.cx, md.cy, t.top ? md.zTop : t.bottom ? md.zBot : md.cz]).v;
    nat(N_SET_ENTITY_COORDS_NO_OFFSET, "ivbbb", [o, O[0] + t.at[0] - M[0], O[1] + t.at[1] - M[1], O[2] + t.at[2] - M[2], 0, 0, 0]);
    nat(N_FREEZE_ENTITY_POSITION, "ib", [o, 1]);
    nat(N_SET_ENTITY_LOD_DIST, "ii", [o, 1500]);
    t.o = o; course.alive++;
    return true;
  }

  const courseWanted = (s) => s >= course.cur - COURSE_WINDOW_BACK && s <= course.cur + COURSE_WINDOW_AHEAD;
  const courseStageReady = (s) => s < 0 || s >= course.stages.length || course.built[s] >= course.stages[s].length;

  function courseStream() {
    const c = course;
    let budget = COURSE_DELETE_PER_TICK;
    for (let s = 0; s < c.stages.length && budget > 0; s++) {
      if (courseWanted(s) || !c.built[s]) continue;
      for (const i of c.stages[s]) { if (c.tiles[i].o) { courseDeleteTile(c.tiles[i]); if (--budget <= 0) break; } }
      if (budget > 0) c.built[s] = 0;
    }
    budget = COURSE_SPAWN_PER_TICK;
    for (const s of [c.cur, c.cur + 1, c.cur + 2, c.cur - 1]) {
      if (s < 0 || s >= c.stages.length || courseStageReady(s)) continue;
      const list = c.stages[s];
      while (budget > 0 && c.built[s] < list.length) {
        const t = c.tiles[list[c.built[s]]];
        if (!t.o && !courseSpawnTile(t)) { const md = c.mdl[t.mh]; if (!md.failed++) tlog("[trainer course] create failed: " + md.name); }
        c.built[s]++; budget--;
      }
      if (budget <= 0) break;
    }
  }

  // Freeze the player's car (or the player) on checkpoint i until the stages around it exist, then let go there.
  function courseHold(i, ped, veh) {
    const c = course, cp = c.cps[i];
    if (!veh && c.lastVeh && nat(N_DOES_ENTITY_EXIST, "i", [c.lastVeh]).i) { nat(N_SET_PED_INTO_VEHICLE, "iii", [ped, c.lastVeh, -1]); veh = c.lastVeh; }
    const ent = veh || ped;
    if (c.held && c.held !== ent) nat(N_FREEZE_ENTITY_POSITION, "ib", [c.held, 0]);
    nat(N_SET_ENTITY_COORDS, "ivbbbb", [ent, cp[0], cp[1], cp[2] + 1.0, 0, 0, 0, 1]);
    nat(N_SET_ENTITY_HEADING, "if", [ent, cp[3]]);
    nat(N_SET_ENTITY_VELOCITY, "iv", [ent, 0.0, 0.0, 0.0]);
    nat(N_FREEZE_ENTITY_POSITION, "ib", [ent, 1]);
    if (veh) { nat(N_SET_VEHICLE_FIXED, "i", [veh]); nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]); }
    nat(N_SET_ENTITY_HEALTH, "iii", [ped, 200, 0]);
    nat(N_SET_GAMEPLAY_CAM_RELATIVE_HEADING, "f", [0.0]);
    c.held = ent; c.holdCp = i;
  }

  function courseRelease() {
    const c = course, cp = c.cps[c.holdCp];
    nat(N_FREEZE_ENTITY_POSITION, "ib", [c.held, 0]);
    nat(N_SET_ENTITY_COORDS, "ivbbbb", [c.held, cp[0], cp[1], cp[2] + 1.0, 0, 0, 0, 1]);
    nat(N_SET_ENTITY_HEADING, "if", [c.held, cp[3]]);
    nat(N_SET_ENTITY_VELOCITY, "iv", [c.held, 0.0, 0.0, 0.0]);
    c.held = 0; c.holdCp = -1; c.guard = Date.now() + 1500;
  }

  function courseRespawn(ped, veh, toStart) {
    const c = course;
    if (!c || c.phase !== "run") { postEngineToast("No course built yet"); return; }
    if (toStart) { c.cur = 0; c.falls = 0; c.t0 = 0; c.tEnd = 0; postEngineToast("Back to the start"); }
    courseHold(c.cur, ped, veh);
  }

  function courseCommand(mode, ped, veh) {
    if (mode === 2 || mode === 3) { courseRespawn(ped, veh, mode === 2); return; }
    const had = !!course;
    courseClear();
    if (had) postEngineToast("Course removed");
  }

  const mmss = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  function courseTick(ped, veh) {
    bulkTick();
    const c = course;
    if (!c) return;
    if (veh) c.lastVeh = veh;
    if (c.phase === "models") {
      let waiting = 0;
      for (const h of Object.keys(c.mdl)) if (!nat(N_HAS_MODEL_LOADED, "i", [h | 0]).i) waiting++;
      if (waiting && ++c.frames < 900) return;
      const report = [], sizes = c.data.sizes || {};
      for (const [key, h] of Object.entries(c.keys)) {
        const md = c.mdl[h];
        if (!nat(N_HAS_MODEL_LOADED, "i", [h]).i) { report.push(key + "=" + md.name + " NOT LOADED"); delete c.keys[key]; continue; }
        if (md.L) { report.push(key + "=" + md.name); continue; }
        const d = nat(N_GET_MODEL_DIMENSIONS, "iVV", [h]).vo, mn = d[0], mx = d[1];
        let sx = mx[0] - mn[0], sy = mx[1] - mn[1], sz = mx[2] - mn[2], how = "measured";
        if (!(sx > 0.05 && sy > 0.05 && sz > 0.05 && sx < 300 && sy < 300)) {
          const g = sizes[md.name] || [2.5, 12.2, 2.6];
          [sx, sy, sz] = g; mn[0] = -sx / 2; mn[1] = -sy / 2; mn[2] = 0; how = sizes[md.name] ? "table" : "GUESSED";
        }
        md.longY = sy >= sx; md.L = Math.max(sx, sy); md.W = Math.min(sx, sy);
        md.cx = mn[0] + sx / 2; md.cy = mn[1] + sy / 2; md.cz = mn[2] + sz / 2; md.zTop = mn[2] + sz; md.zBot = mn[2];
        report.push(key + "=" + md.name + " " + sx.toFixed(2) + "x" + sy.toFixed(2) + "x" + sz.toFixed(2) + " " + how);
      }
      tlog("[trainer course] models: " + report.join(", ") + (c.missing.length ? " | missing: " + c.missing.join(", ") : ""));
      if (!Object.keys(c.keys).length) { postEngineToast("Course: none of its models exist in this game"); courseClear(); return; }
      courseExpand();
      c.phase = "build";
      courseHold(0, ped, veh);
      return;
    }
    courseStream();
    if (c.phase === "build") {
      courseHud(1);
      if (!courseStageReady(0) || !courseStageReady(1)) return;
      courseRelease();
      c.phase = "run";
      postEngineToast("Course ready: " + (c.cps.length - 1) + " checkpoints. R = back to the last checkpoint");
      tlog("[trainer course] ready, " + c.alive + " props alive of " + c.tiles.length);
      if (c.vehicle && !pendingModel) {
        nat(N_REQUEST_MODEL, "i", [c.vehicle]);
        pendingModel = c.vehicle; pendingKind = "spawn_vehicle"; pendingStyle = 0; pendingFrames = 0; pendingLabel = "course car";
        restoreHeading = c.cps[0][3];
      }
      return;
    }
    if (c.held) {   // a respawn waits for its stages
      if (courseStageReady(c.holdCp) && courseStageReady(c.holdCp + 1)) courseRelease();
      courseHud(c.tEnd ? 3 : 2);
      return;
    }
    const ent = veh || ped;
    const pos = nat(N_GET_ENTITY_COORDS, "ib", [ent, 1]).v;
    const last = c.cps.length - 1;
    if (!c.tEnd) {
      const nx = c.cps[c.cur + 1];
      if (!c.t0 && c.cur === 0 && Math.hypot(pos[0] - c.cps[0][0], pos[1] - c.cps[0][1]) > 6) c.t0 = Date.now();
      if (Math.hypot(pos[0] - nx[0], pos[1] - nx[1], (pos[2] - nx[2]) * 0.5) < nx[4]) {
        c.cur++;
        if (!c.t0) c.t0 = Date.now();
        if (c.cur >= last) {
          c.tEnd = Date.now();
          postEngineToast("FINISHED in " + mmss(c.tEnd - c.t0) + " with " + c.falls + " falls!");
          tlog("[trainer course] finished in " + mmss(c.tEnd - c.t0) + ", falls " + c.falls);
        } else {
          postEngineToast("Checkpoint " + c.cur + " / " + last);
          tlog("[trainer course] checkpoint " + c.cur + " at " + mmss(Date.now() - c.t0) + ", falls " + c.falls);
        }
      }
      if (c.cur < last) {
        const m = c.cps[c.cur + 1], big = c.cur + 1 === last;
        nat(N_DRAW_MARKER, "ivvvviiiibbibzzb", [1, m[0], m[1], m[2] - 1.5, 0, 0, 0, 0, 0, 0, m[4] * 2, m[4] * 2, 5.0,
          big ? 60 : 255, big ? 255 : 200, big ? 120 : 0, 90, 0, 0, 2, 0, 0]);
        nat(N_DRAW_MARKER, "ivvvviiiibbibzzb", [0, m[0], m[1], m[2] + 7.0, 0, 0, 0, 0, 0, 0, 3.0, 3.0, 3.0, 255, 200, 0, 200, 1, 1, 2, 0, 0]);
      }
    }
    // Fell off: anything 30 m under both ends of the current stage (and the next one) goes back to the last checkpoint.
    const s = Math.min(c.cur, c.stages.length - 1);
    const floor = Math.min(c.fallZ[s], c.fallZ[Math.min(s + 1, c.stages.length - 1)]) - 30;
    if (Date.now() > c.guard && (pos[2] < floor || nat(N_IS_ENTITY_IN_WATER, "i", [ent]).i)) {
      if (!c.tEnd) c.falls++;
      courseHold(c.cur, ped, veh);
    }
    courseHud(c.tEnd ? 3 : 2);
  }

  // ---- Story Mode autosave -------------------------------------------------------------------------------------------------------------------------------------
  // GTA V only autosaves at fixed story moments (mission passed, character switch, ...). A player who roams for an hour and leaves comes back at the last of those, which
  // in this port is often the Prologue. DO_AUTO_SAVE writes the game's own autosave slot, the same file the story script writes (userdata_wasm.cpp then stores it
  // in IndexedDB and, through io_worker.js, in work/userdata). It is only requested when the game is in free roam: no mission (GET_MISSION_FLAG), no cutscene,
  // no character switch, no wanted level, no pause menu, not dead or arrested, screen visible, and control is on. Saving mid-mission would store a state the mission
  // script cannot resume. Every attempt and every skip reason is logged ([trainer story]).
  const AUTOSAVE_FIRST_MS = 60000, AUTOSAVE_EVERY_MS = 120000, AUTOSAVE_RETRY_MS = 15000, SAVE_WANT_RETRY_MS = 2000;
  // A save somebody asked for (the shortcut, or a mission that just ended) is retried every 2 s until the game allows it (up to a few minutes) instead of being dropped.
  let missionEndAt = 0, stuckSince = 0, stuckTries = 0, stuckDiagAt = 0, ctrlLogged = false;
  let saveWantUntil = 0, saveWantManual = false, saveAnnounce = false, lastMissionFlag = 0, storyLastWhy = "", saveWantWhy = "";
  let storyT0 = 0, storyLastSaveMs = 0, storyNextTryMs = 0, storyPendingCheckMs = 0, storySkipLogged = "", storySaves = 0;
  function storyBlocker(player, ped, wanted) {
    if (nat(N_GET_IS_AUTO_SAVE_OFF, "").i) return "autosave is switched off in the game settings";
    if (nat(N_IS_AUTO_SAVE_IN_PROGRESS, "").i) return "a save is already in progress";
    if (nat(N_GET_MISSION_FLAG, "").i) return "a mission is running";
    if (nat(N_IS_CUTSCENE_ACTIVE, "").i) return "a cutscene is playing";
    if (nat(N_IS_PLAYER_SWITCH_IN_PROGRESS, "").i) return "a character switch is in progress";
    if (nat(N_IS_PAUSE_MENU_ACTIVE, "").i) return "the pause menu is open";
    if (nat(N_IS_SCREEN_FADED_OUT, "").i) return "the screen is faded out";
    if (wanted > 0) return "you are wanted";
    if (nat(N_IS_PLAYER_BEING_ARRESTED, "ib", [player, 1]).i) return "you are being arrested";
    if (nat(N_IS_PED_DEAD_OR_DYING, "ii", [ped, 1]).i) return "you are dead";
    if (!nat(N_IS_PLAYER_CONTROL_ON, "i", [player]).i) return "player control is off";
    return "";
  }
  function storySave(manual) {
    if (!storyMode() || !T32) { if (manual) postEngineToast("Saving is for Story Mode"); return; }
    let player, ped, wanted;
    try {
      player = nat(N_GET_PLAYER_INDEX, "").i; ped = nat(N_PLAYER_PED_ID, "").i;
      wanted = nat(N_GET_PLAYER_WANTED_LEVEL, "i", [player]).i;
    } catch (e) { return; }
    const why = storyBlocker(player, ped, wanted);
    if (why) {
      storyLastWhy = why;
      if (storySkipLogged !== why) { storySkipLogged = why; tlog("[trainer story] autosave skipped: " + why); }
      return false;
    }
    storySkipLogged = "";
    // The game answers the first save of a session with an "autosave slot already contains ... overwrite?" alert and the script thread stops (heartbeat T32[1] frozen) until it is
    // answered. T32[57] counts save requests so the page knows one was just made and can press Yes if the heartbeat stops (homepage.html, "save prompt").
    nat(N_DO_AUTO_SAVE, "");
    Atomics.add(T32, 57, 1);
    storyLastSaveMs = performance.now();
    storyPendingCheckMs = storyLastSaveMs + 6000;
    storySaves++;
    tlog("[trainer story] autosave requested (" + (manual ? "manual" : "timer") + ", #" + storySaves + ")");
    storyLastWhy = "";
    return true;
  }
  function storyWantSave(manual, ms, note) {
    saveWantUntil = performance.now() + ms; saveWantManual = saveWantManual || manual; saveAnnounce = true; storyNextTryMs = 0;
    tlog("[trainer story] save wanted (" + note + ")");
  }

  // ---- Story position memory ------------------------------------------------------------------------------------------------------------------------------------
  // The game puts a loaded Story save back at the character's safehouse, wherever the save was made (you die, wake up at the police station, save, reload: home). So: while the
  // player is in free roam the trainer reports the position every 5 s to the dev server (/storypos); the server pairs the last report with each Story save file that arrives
  // (work/story-position.json). After a load, once the player is in free roam for 5 s with the same character, and the stored position belongs to the newest save on disk
  // (/storypos says valid), the player is moved there. A mission starting first cancels the restore. Never in a mission: the story script owns the position then.
  let spTpAt = 0, spVeh = 0, spStage = 0, spData = null, spFreeSince = 0, spLastPost = 0, spLastErr = "", spLoggedStage = -1;
  function storyIsFree(player, ped) {
    return !nat(N_GET_MISSION_FLAG, "").i && !nat(N_IS_CUTSCENE_ACTIVE, "").i && !nat(N_IS_PLAYER_SWITCH_IN_PROGRESS, "").i && !nat(N_IS_SCREEN_FADED_OUT, "").i &&
      !!nat(N_IS_PLAYER_CONTROL_ON, "i", [player]).i && !nat(N_IS_PED_DEAD_OR_DYING, "ii", [ped, 1]).i && !nat(N_IS_PAUSE_MENU_ACTIVE, "").i;
  }
  function storyPositionTick(now) {
    const player = nat(N_GET_PLAYER_INDEX, "").i, ped = nat(N_PLAYER_PED_ID, "").i;
    if (!ped || player < 0) return;
    const free = storyIsFree(player, ped);
    if (spLoggedStage !== spStage) { spLoggedStage = spStage; tlog("[trainer story] position memory stage " + spStage + (free ? " (free roam)" : " (not free roam)")); }
    if (spStage === 0) {
      spStage = 2; spData = null;
      try {      // synchronous: promise callbacks never run in this thread once the game is going (the first version waited for a fetch .then for ever)
        const x = new XMLHttpRequest(); x.open("GET", "/storypos", false); x.send();
        if (x.status === 200) spData = JSON.parse(x.responseText);
      } catch (e) { tlog("[trainer story] saved position request failed: " + (e && e.message || e)); }
      tlog("[trainer story] saved position: " + (spData && spData.valid ? "valid (" + Math.round(spData.x) + "," + Math.round(spData.y) + "," + Math.round(spData.z) + ")" : "none for the newest save"));
      return;
    }
    if (spStage === 1) return;
    if (spStage === 2) {
      if (nat(N_GET_MISSION_FLAG, "").i) { spStage = 9; tlog("[trainer story] position restore skipped: a mission is running"); return; }
      if (!spData || !spData.valid) { spStage = 9; return; }
      if (!free) { spFreeSince = 0; return; }
      if (!spFreeSince) spFreeSince = now;
      if (now - spFreeSince < 5000) return;
      spStage = 9;
      const model = nat(N_GET_ENTITY_MODEL, "i", [ped]).i | 0;
      const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
      const dist = Math.hypot(c[0] - spData.x, c[1] - spData.y, (c[2] - spData.z) * 0.5);
      if ((spData.m | 0) !== model) { tlog("[trainer story] position restore skipped: another character (saved " + spData.m + ", now " + model + ")"); return; }
      if (dist < 30) { tlog("[trainer story] position restore not needed (" + Math.round(dist) + " m away)"); return; }
      tpX = spData.x; tpY = spData.y; tpTargetZ = 0;
      nat(N_SET_ENTITY_COORDS, "ivbbbb", [ped, spData.x, spData.y, spData.z + 1.0, 0, 0, 0, 1]);
      if (isFinite(spData.h)) nat(N_SET_ENTITY_HEADING, "if", [ped, spData.h]);
      teleportFrames = 1;
      tlog("[trainer story] position restored to " + Math.round(spData.x) + "," + Math.round(spData.y) + "," + Math.round(spData.z) + " (was " + Math.round(dist) + " m away)");
      // the rest of the moment: cheats that were on, health and armour, time of day, and the vehicle you were in
      if (spData.tg) Atomics.or(T32, 2, spData.tg | 0);
      if (spData.tb) Atomics.or(T32, TB, spData.tb | 0);
      if (spData.hp > 0) nat(N_SET_ENTITY_HEALTH, "iii", [ped, spData.hp | 0, 0]);
      if (spData.ar > 0) nat(N_SET_PED_ARMOUR, "ii", [ped, spData.ar | 0]);
      if (spData.hr >= 0 && spData.hr < 24) nat(N_SET_CLOCK_TIME, "iii", [spData.hr | 0, spData.mn | 0, 0]);
      spTpAt = now; spVeh = spData.vm | 0;
      tlog("[trainer story] restored cheats A=0x" + ((spData.tg | 0) >>> 0).toString(16) + " B=0x" + ((spData.tb | 0) >>> 0).toString(16) + ", health " + spData.hp + ", armour " + spData.ar + ", time " + spData.hr + ":" + spData.mn + ", vehicle " + spVeh);
      postEngineToast("Back where you saved");
      return;
    }
    if (spStage === 9 && spVeh && !pendingModel && (!teleportFrames || now - spTpAt > 4000)) {      // once the ground under the player has settled: bring the vehicle back
      const hash = spVeh; spVeh = 0;
      if (!nat(N_IS_PED_IN_ANY_VEHICLE, "ib", [ped, 0]).i && nat(N_IS_MODEL_A_VEHICLE, "i", [hash]).i) {
        nat(N_REQUEST_MODEL, "i", [hash]);
        pendingModel = hash; pendingKind = "spawn_vehicle"; pendingStyle = 0; pendingFrames = 0; pendingLabel = "Your vehicle";
        restoreHeading = isFinite(spData && spData.h) ? spData.h : null;
        tlog("[trainer story] bringing your vehicle back (model " + hash + ")");
      }
    }
    if (spStage === 9 && free && now - spLastPost >= 5000) {      // report where the player stands (only after the restore is over, so the safehouse spawn never overwrites it)
      spLastPost = now;
      const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
      if (!c || !isFinite(c[0]) || (Math.abs(c[0]) < 1 && Math.abs(c[1]) < 1)) return;
      // what a loaded Story save does not bring back: where you stood, the vehicle you were in, the cheats that were on, health and armour, the time of day
      const inV = nat(N_IS_PED_IN_ANY_VEHICLE, "ib", [ped, 0]).i !== 0, v = inV ? nat(N_GET_VEHICLE_PED_IS_IN, "ib", [ped, 0]).i : 0;
      fetch("/storypos", { method: "POST", body: JSON.stringify({ m: nat(N_GET_ENTITY_MODEL, "i", [ped]).i | 0, x: c[0], y: c[1], z: c[2], h: nat(N_GET_ENTITY_HEADING, "i", [ped]).f,
        tg: Atomics.load(T32, 2) | 0, tb: Atomics.load(T32, TB) & ~(1 << 17), hp: nat(N_GET_ENTITY_HEALTH, "i", [ped]).i, ar: nat(N_GET_PED_ARMOUR, "i", [ped]).i,
        hr: nat(N_GET_CLOCK_HOURS, "").i, mn: nat(N_GET_CLOCK_MINUTES, "").i, vm: v ? (nat(N_GET_ENTITY_MODEL, "i", [v]).i | 0) : 0 }) }).catch(() => {});
    }
  }
  // ---- Vanilla Unicorn plays Drake ------------------------------------------------------------------------------------------------------------------------------
  // The club's three static emitters (stage, main room, back room) are the only users of HIDDEN_RADIO_STRIP_CLUB in game.dat151. Every music station already plays
  // the Drake songs (work/drake), so near the club the emitters are retuned to one of them, a different station each visit. Set on arrival and again once inside,
  // in case the interior streaming in resets them; never every tick, since retuning restarts the stream.
  const N_SET_EMITTER_RADIO_STATION = 44467;
  const CLUB_EMITTERS = ["LOS_SANTOS_VANILLA_UNICORN_01_STAGE", "LOS_SANTOS_VANILLA_UNICORN_02_MAIN_ROOM", "LOS_SANTOS_VANILLA_UNICORN_03_BACK_ROOM"];
  const DRAKE_STATIONS = ["RADIO_03_HIPHOP_NEW", "RADIO_02_POP", "RADIO_04_PUNK", "RADIO_06_COUNTRY", "RADIO_07_DANCE_01", "RADIO_08_MEXICAN", "RADIO_09_HIPHOP_OLD",
    "RADIO_01_CLASS_ROCK", "RADIO_12_REGGAE", "RADIO_13_JAZZ", "RADIO_14_DANCE_02", "RADIO_15_MOTOWN", "RADIO_16_SILVERLAKE", "RADIO_17_FUNK", "RADIO_18_90S_ROCK"];
  const CLUB_X = 116.0, CLUB_Y = -1290.0;
  let clubStage = 0, clubVisits = 0;   // 0 away, 1 tuned on arrival, 2 tuned again inside
  function stripClubTick(ped) {
    const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
    if (!c || !isFinite(c[0]) || (Math.abs(c[0]) < 1 && Math.abs(c[1]) < 1)) return;
    const d = Math.hypot(c[0] - CLUB_X, c[1] - CLUB_Y);
    if (d > 220) { clubStage = 0; return; }
    if ((clubStage === 0 && d < 150) || (clubStage === 1 && d < 30)) {
      if (clubStage === 0) clubVisits++;
      const st = DRAKE_STATIONS[(clubVisits - 1) % DRAKE_STATIONS.length];
      for (const em of CLUB_EMITTERS) nat(N_SET_EMITTER_RADIO_STATION, "ss", [em, st]);
      tlog("[trainer club] Vanilla Unicorn emitters -> " + st + (clubStage ? " (inside)" : ""));
      clubStage++;
    }
  }
  function storyAutosaveTick(isPlaying) {
    if (!isPlaying || !storyMode()) return;
    const now = performance.now();
    if (!storyT0) { storyT0 = now; storyNextTryMs = now + AUTOSAVE_FIRST_MS; tlog("[trainer story] Story Mode autosave timer started"); return; }
    try { storyPositionTick(now); } catch (e) { const em = String(e && e.message || e); if (em !== spLastErr) { spLastErr = em; tlog("[trainer story] position error: " + em + " (stage " + spStage + ")"); } }
    try {      // a mission that just ended: the game's own autosave after it can take minutes or never come, so ask for one
      const mf = nat(N_GET_MISSION_FLAG, "").i;
      if (lastMissionFlag && !mf) { missionEndAt = now; tlog("[trainer story] mission ended"); }
      if (missionEndAt && now - missionEndAt > 12000) { missionEndAt = 0; storyWantSave(false, 240000, "12 s after the mission ended"); }
      lastMissionFlag = mf;
    } catch (e) {}
    try {      // The game's own autosave after a mission pass is serviced by the script "autosave_controller". If it never completes the game stays "save in progress" for ever (seen after
      // every mission pass: the save is never written and the progress is lost on exit). Log the facts, then service the request ourselves.
      if (!ctrlLogged) { ctrlLogged = true; tlog("[trainer story] autosave_controller script: exists=" + nat(N_DOES_SCRIPT_EXIST, "s", ["autosave_controller"]).i + " threads=" + nat(N_SCRIPT_THREADS_BY_HASH, "i", [joaat("autosave_controller")]).i); }
      const busyNow = nat(N_IS_AUTO_SAVE_IN_PROGRESS, "").i, codeReq = nat(N_HAS_CODE_REQUESTED_AUTOSAVE, "").i;
      if (busyNow || codeReq) {
        if (!stuckSince) stuckSince = now;
        if (now - stuckDiagAt > 15000 && now - stuckSince > 10000) { stuckDiagAt = now; tlog("[trainer story] save pending for " + Math.round((now - stuckSince) / 1000) + " s: inProgress=" + busyNow + " codeRequested=" + codeReq + " savingMessage=" + nat(N_GET_IS_DISPLAYING_SAVE_MESSAGE, "").i + " manualStatus=" + nat(49067, "").i + " controllerThreads=" + nat(N_SCRIPT_THREADS_BY_HASH, "i", [joaat("autosave_controller")]).i); }
        if (now - stuckSince > 25000 && stuckTries < 4 && now - storyLastSaveMs > 20000) {
          stuckTries++; storyLastSaveMs = now;
          nat(N_CLEAR_CODE_REQUESTED_AUTOSAVE, "");
          Atomics.add(T32, 57, 1);
          nat(N_DO_AUTO_SAVE, "");
          storyPendingCheckMs = now + 6000; saveAnnounce = true;
          tlog("[trainer story] save stuck: cleared the request and asked the game to save again (try " + stuckTries + ")");
        }
      } else if (stuckSince) { tlog("[trainer story] the pending save finished after " + Math.round((now - stuckSince) / 1000) + " s"); stuckSince = 0; stuckTries = 0; }
    } catch (e) {}
    if (storyPendingCheckMs && now >= storyPendingCheckMs) {      // report whether the game says the save went through
      storyPendingCheckMs = 0;
      try {
        const busy = nat(N_IS_AUTO_SAVE_IN_PROGRESS, "").i;
        const ok = nat(N_DID_SAVE_COMPLETE_SUCCESSFULLY, "").i;
        tlog("[trainer story] autosave result: inProgress=" + busy + " completeSuccessfully=" + ok);
        if (busy) storyPendingCheckMs = now + 4000;
        else if (saveAnnounce) { saveAnnounce = false; postEngineToast(ok ? "Game saved" : "The game reported a problem while saving"); }
      } catch (e) {}
    }
    if (saveWantUntil && now > saveWantUntil) {
      saveWantUntil = 0;
      if (saveAnnounce) { saveAnnounce = false; postEngineToast("Could not save: " + storyLastWhy); }
      saveWantManual = false;
    }
    if (now < storyNextTryMs) return;
    const okSave = storySave(false);
    if (okSave) { storyNextTryMs = now + AUTOSAVE_EVERY_MS; if (saveWantUntil) { saveWantUntil = 0; saveWantManual = false; } }
    else storyNextTryMs = now + (saveWantUntil ? SAVE_WANT_RETRY_MS : AUTOSAVE_RETRY_MS);
  }
  let storyNoteLogged = false;
  function persistTick(ped, veh, desired) {
    if (T32 && !modeKnown()) {      // the page has not announced the mode yet: never restore a sandbox session into a Story game by accident
      if (!restoreT0) restoreT0 = performance.now();
      if (performance.now() - restoreT0 < 20000) return;
    }
    if (storyMode()) {
      restoreStage = 9;
      if (!storyNoteLogged) { storyNoteLogged = true; tlog("[trainer story] Story Mode: sandbox session restore and stored cheats are off"); }
      return;
    }
    if (restoreStage < 0) {      // /state has not answered: ask again every 5 s (a failed first fetch used to leave the session unrestored for good)
      if (performance.now() - stateFetchT0 > 5000 && stateFetchTries < 12) fetchSessionState();
      return;
    }
    playingTicks++;
    if (restoreStage < 9 && course && restoreStage < 2) { restoreStage = 9; tlog("[trainer persist] restore skipped: a prop course is being built"); return; }
    if (restoreStage < 9) {
      // Start ~7 s of wall time after the first tick (the world is shown ~6 s in); tick counts are useless here, ticks run at ~10 Hz while loading.
      const nowMs = performance.now();
      if (!restoreT0) restoreT0 = nowMs;
      if (nowMs - restoreT0 < 7000) return;
      const rd = restoreData;
      if (restoreStage === 0) {
        if (rd.toggles) Atomics.or(T32, 2, rd.toggles | 0);
        if (rd.togglesB) Atomics.or(T32, TB, rd.togglesB | 0);
        if (rd.skinHash && rd.skin && !pendingModel) {
          nat(N_REQUEST_MODEL, "i", [rd.skinHash]);
          pendingModel = rd.skinHash; pendingKind = "spawn_skin"; pendingStyle = 0; pendingFrames = 0; pendingLabel = rd.skin;
        }
        restoreStage = 1;
      } else if (restoreStage === 1) {
        if (!pendingModel) {
          tpX = rd.x; tpY = rd.y; tpTargetZ = 0;
          nat(N_SET_ENTITY_COORDS, "ivbbbb", [veh || nat(N_PLAYER_PED_ID, "").i, rd.x, rd.y, rd.z + 1.0, 0, 0, 0, 1]);
          teleportFrames = 1; restoreStage = 2; tpT0 = performance.now();
        }
      } else if (restoreStage === 2) {
        if ((!teleportFrames && performance.now() - tpT0 > 1000) || performance.now() - tpT0 > 5000) {     // ground settled, or 5 s passed
          if (rd.veh && rd.veh.hash && !veh && !pendingModel) {
            nat(N_REQUEST_MODEL, "i", [rd.veh.hash]);
            pendingModel = rd.veh.hash; pendingKind = "spawn_vehicle"; pendingStyle = rd.veh.style | 0; pendingFrames = 0; pendingLabel = rd.veh.name || "Vehicle";
            restoreHeading = isFinite(rd.heading) ? rd.heading : null;
            restoreStage = 3;
          } else restoreStage = 9;
        }
      } else if (restoreStage === 3) {
        if (!pendingModel) restoreStage = 9;
      }
      if (restoreStage === 9) {
        playingTicks = 0;
        postEngineToast("Session restored");
        tlog("[trainer persist] restored x=" + rd.x + " y=" + rd.y + " veh=" + (rd.veh ? rd.veh.name : "none"));
      }
      return;
    }
    if (playingTicks % 90 !== 0 || teleportFrames || pendingModel || course) return;     // never store a spot in the sky above a course
    if (nat(N_GET_ENTITY_HEALTH, "i", [ped]).i <= 0) return;
    const ent = veh || ped;
    const c = nat(N_GET_ENTITY_COORDS, "ib", [ent, 1]).v;
    if (!c || !isFinite(c[0]) || !isFinite(c[2]) || c[2] < -50 || (Math.abs(c[0]) < 1 && Math.abs(c[1]) < 1)) return;
    const st = { v: 1, t: Date.now(), x: c[0], y: c[1], z: c[2], heading: nat(N_GET_ENTITY_HEADING, "i", [ent]).f,
      skin: savedSkin, skinHash: savedSkinHash, toggles: desired, togglesB: Atomics.load(T32, TB) & ~(1 << 17),
      veh: (veh && veh === spawnedVeh && spawnedInfo) ? spawnedInfo : null };
    fetch("/state", { method: "POST", body: JSON.stringify(st) }).catch(()=>{});
  }

  let tickCount = 0, tickGapMs = 20, passiveTicks = 0, lastTickLogMs = 0;
  // Story Mode with nothing switched on in the menu: the story scripts run the game and the trainer only keeps the heartbeat, the menu's live values and the autosave
  // timer going, about 4 times a second with a handful of natives (the full tick runs ~50 times a second with 15+ natives, each one a stack allocation and a table call
  // made inside the script thread's Wait). Any toggle, queued command, pending spawn or teleport switches back to the full tick within 250 ms.
  function storyPassiveTick() {
    passiveTicks++;
    let player = -1, ped = 0, playing = 0;
    try {
      player = nat(N_GET_PLAYER_INDEX, "").i;
      ped = nat(N_PLAYER_PED_ID, "").i;
      if (player >= 0) cachedPlayer = player;
      playing = (player >= 0 && ped) ? nat(N_IS_PLAYER_PLAYING, "i", [player]).i : 0;
    } catch (e) { return; }
    Atomics.add(T32, 1, 1);
    if (ped && passiveTicks % 4 === 0) {
      try {
        const inVeh = nat(N_IS_PED_IN_ANY_VEHICLE, "ib", [ped, 0]).i !== 0;
        const veh = inVeh ? nat(N_GET_VEHICLE_PED_IS_IN, "ib", [ped, 0]).i : 0;
        const wanted = nat(N_GET_PLAYER_WANTED_LEVEL, "i", [player]).i;
        Atomics.store(T32, 4, 1 | (inVeh ? 2 : 0) | ((wanted & 0xff) << 8));
        const ent = veh || ped;
        const pc = nat(N_GET_ENTITY_COORDS, "ib", [ent, 1]).v;
        TF32[32] = pc[0]; TF32[33] = pc[1]; TF32[34] = pc[2];
        TF32[35] = nat(N_GET_ENTITY_HEADING, "i", [ent]).f;
        TF32[36] = nat(N_GET_ENTITY_SPEED, "i", [ent]).f;
        T32[37] = nat(N_GET_ENTITY_HEALTH, "i", [ped]).i;
        T32[38] = nat(N_GET_PED_ARMOUR, "i", [ped]).i;
        T32[39] = nat(N_GET_CLOCK_HOURS, "").i;
        T32[40] = nat(N_GET_CLOCK_MINUTES, "").i;
      } catch (e) {}
      try { stripClubTick(ped); } catch (e) {}
    }
    try { storyAutosaveTick(playing); } catch (e) { if (++persistErrs <= 5) tlog("[trainer story] error: " + (e && e.message || e)); }
  }
  function trainerTick() {
    tickCount++;
    if (!getTrainerBuffer()) {
      if (tickCount <= 5 || tickCount % 500 === 0) {
        tlog("[trainer error] getTrainerBuffer=false on tick " + tickCount);
      }
      return;
    }

    // Pause menu up: the engine is already struggling to produce frames, so do the full cheat tick only every 10th call
    // (one cheap native in between). Everything catches up as soon as the menu closes.
    try {
      if (nat(N_IS_PAUSE_MENU_ACTIVE, "").i && tickCount % (tickGapMs > 20 ? 2 : 10) !== 0) return;
    } catch (e) {}

    if (storyMode() && !pendingModel && !teleportFrames && Atomics.load(T32, 2) === 0 && Atomics.load(T32, TB) === 0 && appliedMask === 0 && appliedMaskB === 0 &&
        Atomics.load(T32, 64) === Atomics.load(T32, 65)) {
      tickGapMs = 250;
      storyPassiveTick();
      return;
    }
    tickGapMs = 20;

    let player = -1, ped = 0, pedExists = 0, isPlaying = 0;
    try {
      player = nat(N_GET_PLAYER_INDEX, "").i;
      ped = nat(N_PLAYER_PED_ID, "").i;
      pedExists = ped ? nat(N_DOES_ENTITY_EXIST, "i", [ped]).i : 0;
      isPlaying = (player >= 0) ? nat(N_IS_PLAYER_PLAYING, "i", [player]).i : 0;
    } catch (e) {
      if (tickCount <= 10 || tickCount % 300 === 0) {
        tlog("[trainer nat exception] tick=" + tickCount + " err=" + (e.message || e));
      }
      return;
    }

    if (tickCount <= 10 || performance.now() - lastTickLogMs > 60000) {
      lastTickLogMs = performance.now();
      const qHead = Atomics.load(T32, 64);
      const qTail = Atomics.load(T32, 65);
      const desired = Atomics.load(T32, 2);
      tlog("[trainer tick #" + tickCount + "] player=" + player + " ped=" + ped + " exist=" + pedExists + " playing=" + isPlaying + " q=" + qHead + "/" + qTail + " des=" + desired);
    }

    if (player >= 0) cachedPlayer = player;
    if (!ped || !pedExists) return;

    let inVeh = nat(N_IS_PED_IN_ANY_VEHICLE, "ib", [ped, 0]).i !== 0;
    let veh = inVeh ? nat(N_GET_VEHICLE_PED_IS_IN, "ib", [ped, 0]).i : 0;
    if (!veh) {
      const usingVeh = nat(N_GET_VEHICLE_PED_IS_USING, "i", [ped]).i;
      if (usingVeh) {
        veh = usingVeh;
        inVeh = true;
      }
    }

    // 1. Heartbeat & State Flags
    Atomics.add(T32, 1, 1);
    if (tickCount % 30 === 0) syncWardrobeState(ped);
    const wanted = nat(N_GET_PLAYER_WANTED_LEVEL, "i", [player]).i;
    const stateFlags = 1 | (inVeh ? 2 : 0) | ((wanted & 0xff) << 8);
    Atomics.store(T32, 4, stateFlags);

    // 2. Continuous & Toggle Cheats
    const desired = Atomics.load(T32, 2);
    const changed = desired ^ appliedMask;
    if (changed) {
      tlog("[trainer toggles] desired=0x" + desired.toString(16) + " changed=0x" + changed.toString(16));
    }

    // God mode (bit 0)
    if (desired & (1 << 0)) {
      nat(N_SET_PLAYER_INVINCIBLE, "ib", [player, 1]);
      nat(N_SET_ENTITY_INVINCIBLE, "ib", [ped, 1]);
      const hp = nat(N_GET_ENTITY_HEALTH, "i", [ped]).i;
      if (hp > 0 && hp < 180) {
        nat(N_SET_ENTITY_HEALTH, "iii", [ped, 200, 0]);
        nat(N_SET_PED_ARMOUR, "ii", [ped, 100]);
      }
    } else if (changed & (1 << 0)) {
      nat(N_SET_PLAYER_INVINCIBLE, "ib", [player, 0]);
      nat(N_SET_ENTITY_INVINCIBLE, "ib", [ped, 0]);
    }

    // Never wanted (bit 1)
    if (desired & (1 << 1)) {
      nat(N_SET_MAX_WANTED_LEVEL, "i", [0]);
      nat(N_CLEAR_PLAYER_WANTED_LEVEL, "i", [player]);
    } else if (changed & (1 << 1)) {
      nat(N_SET_MAX_WANTED_LEVEL, "i", [5]);
    }

    // Infinite ammo (bit 2)
    if (desired & (1 << 2)) {
      nat(N_SET_PED_INFINITE_AMMO_CLIP, "ib", [ped, 1]);
    } else if (changed & (1 << 2)) {
      nat(N_SET_PED_INFINITE_AMMO_CLIP, "ib", [ped, 0]);
    }

    // Super jump (bit 3)
    if (desired & (1 << 3)) nat(N_SET_SUPER_JUMP_THIS_FRAME, "i", [player]);

    // Fast run (bit 4)
    if (desired & (1 << 4)) {
      nat(N_SET_RUN_SPRINT_MULTIPLIER_FOR_PLAYER, "if", [player, 1.49]);
    } else if (changed & (1 << 4)) {
      nat(N_SET_RUN_SPRINT_MULTIPLIER_FOR_PLAYER, "if", [player, 1.0]);
    }

    // No ragdoll (bit 5)
    if (desired & (1 << 5)) {
      nat(N_SET_PED_CAN_RAGDOLL, "ib", [ped, 0]);
    } else if (changed & (1 << 5)) {
      nat(N_SET_PED_CAN_RAGDOLL, "ib", [ped, 1]);
    }

    // Explosive ammo (bit 6)
    if (desired & (1 << 6)) nat(N_SET_EXPLOSIVE_AMMO_THIS_FRAME, "i", [player]);

    // Fire ammo (bit 7)
    if (desired & (1 << 7)) nat(N_SET_FIRE_AMMO_THIS_FRAME, "i", [player]);

    // Explosive melee (bit 8)
    if (desired & (1 << 8)) nat(N_SET_EXPLOSIVE_MELEE_THIS_FRAME, "i", [player]);

    // Slow motion (bit 9)
    if (desired & (1 << 9)) {
      nat(N_SET_TIME_SCALE, "f", [0.4]);
    } else if (changed & (1 << 9)) {
      nat(N_SET_TIME_SCALE, "f", [1.0]);
    }

    // Invisibility (bit 10)
    if (desired & (1 << 10)) {
      nat(N_SET_ENTITY_VISIBLE, "ibb", [ped, 0, 0]);
    } else if (changed & (1 << 10)) {
      nat(N_SET_ENTITY_VISIBLE, "ibb", [ped, 1, 0]);
    }

    // Unlimited stamina (bit 11)
    if (desired & (1 << 11)) nat(N_RESTORE_PLAYER_STAMINA, "if", [player, 1.0]);

    // Indestructible vehicle (bit 12)
    if (desired & (1 << 12)) {
      if (veh) {
        if (veh !== lastGodVeh || (changed & (1 << 12))) {
          if (lastGodVeh && lastGodVeh !== veh) applyVehicleGod(lastGodVeh, false, ped);
          applyVehicleGod(veh, true, ped);
          lastGodVeh = veh;
        }

        // Active frame-by-frame protection
        nat(N_SET_ENTITY_INVINCIBLE, "ib", [veh, 1]);
        nat(N_SET_VEHICLE_CAN_BE_VISIBLY_DAMAGED, "ib", [veh, 0]);
        nat(N_SET_VEHICLE_DAMAGE_SCALE, "if", [veh, 0.0]);
        nat(N_SET_VEHICLE_ENGINE_HEALTH, "if", [veh, 1000.0]);
        nat(N_SET_VEHICLE_PETROL_TANK_HEALTH, "if", [veh, 1000.0]);
        nat(N_SET_VEHICLE_BODY_HEALTH, "if", [veh, 1000.0]);
        nat(N_SET_ENTITY_HEALTH, "ii", [veh, 1000]);
        nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [veh, 0.0]);
        nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]);
        // Dents can persist even when health never drops: re-apply the full protection set every ~90 ticks
        // (flags are cleared by some engine events) and fully repair every 6 ticks.
        if (tickCount % 90 === 0) applyVehicleGod(veh, true, ped);
        else if (tickCount % 6 === 0) nat(N_SET_VEHICLE_FIXED, "i", [veh]);
        nat(N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN, "ib", [ped, 0]);
        nat(N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE, "ii", [ped, 1]);

        // Auto-heal any damage from extreme impact/train collisions
        const bHp = nat(N_GET_VEHICLE_BODY_HEALTH, "i", [veh]).f;
        const eHp = nat(N_GET_ENTITY_HEALTH, "i", [veh]).i;
        if (bHp < 995.0 || eHp < 1000) {
          nat(N_SET_VEHICLE_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [veh, 1, 1, 0]);
        }
      } else if (lastGodVeh) {
        applyVehicleGod(lastGodVeh, false, ped);
        lastGodVeh = 0;
      }
    } else if (changed & (1 << 12)) {
      if (veh) applyVehicleGod(veh, false, ped);
      if (lastGodVeh && lastGodVeh !== veh) applyVehicleGod(lastGodVeh, false, ped);
      lastGodVeh = 0;
    }

    // Freeze time (bit 13)
    if (desired & (1 << 13)) {
      nat(N_PAUSE_CLOCK, "b", [1]);
    } else if (changed & (1 << 13)) {
      nat(N_PAUSE_CLOCK, "b", [0]);
    }

    // No traffic / peds (bit 14)
    if (desired & (1 << 14)) {
      nat(N_SET_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME, "f", [0.0]);
      nat(N_SET_PED_DENSITY_MULTIPLIER_THIS_FRAME, "f", [0.0]);
      nat(N_SET_RANDOM_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME, "f", [0.0]);
      nat(N_SET_PARKED_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME, "f", [0.0]);
    }

    // Riot mode (bit 15)
    if (desired & (1 << 15)) {
      nat(N_SET_RIOT_MODE_ENABLED, "b", [1]);
    } else if (changed & (1 << 15)) {
      nat(N_SET_RIOT_MODE_ENABLED, "b", [0]);
    }

    // Moon gravity (bit 16)
    if (desired & (1 << 16)) {
      nat(N_SET_GRAVITY_LEVEL, "i", [2]);
    } else if (changed & (1 << 16)) {
      nat(N_SET_GRAVITY_LEVEL, "i", [0]);
    }

    // Night vision (bit 17)
    if (desired & (1 << 17)) {
      nat(N_SET_NIGHTVISION, "b", [1]);
    } else if (changed & (1 << 17)) {
      nat(N_SET_NIGHTVISION, "b", [0]);
    }

    // Thermal vision (bit 18)
    if (desired & (1 << 18)) {
      nat(N_SET_SEETHROUGH, "b", [1]);
    } else if (changed & (1 << 18)) {
      nat(N_SET_SEETHROUGH, "b", [0]);
    }

    // Fast swim (bit 19)
    if (desired & (1 << 19)) {
      nat(N_SET_SWIM_MULTIPLIER_FOR_PLAYER, "if", [player, 1.49]);
    } else if (changed & (1 << 19)) {
      nat(N_SET_SWIM_MULTIPLIER_FOR_PLAYER, "if", [player, 1.0]);
    }

    // Drift mode / low grip (bit 20)
    if (veh) {
      if (desired & (1 << 20)) {
        nat(N_SET_VEHICLE_REDUCE_GRIP, "ib", [veh, 1]);
      } else if (changed & (1 << 20)) {
        nat(N_SET_VEHICLE_REDUCE_GRIP, "ib", [veh, 0]);
      }
    }

    // Bulletproof tyres (bit 21)
    if (veh) {
      if (desired & (1 << 21)) {
        nat(N_SET_VEHICLE_TYRES_CAN_BURST, "ib", [veh, 0]);
      } else if (changed & (1 << 21)) {
        nat(N_SET_VEHICLE_TYRES_CAN_BURST, "ib", [veh, 1]);
      }
    }

    // ---- Second toggle word (menu redesign): desired bits at T32[44], applied bits at T32[45] ----
    const desiredB = Atomics.load(T32, TB);
    const changedB = desiredB ^ appliedMaskB;
    const slow = (tickCount % 30 === 0);
    if (changedB) {
      tlog("[trainer toggles B] desired=0x" + desiredB.toString(16) + " changed=0x" + changedB.toString(16));
    }
    const onB = (bit) => (desiredB & (1 << bit)) !== 0;
    const chB = (bit) => (changedB & (1 << bit)) !== 0;
    if (onB(0) || chB(0)) { if (onB(0) ? (slow || chB(0)) : true) nat(N_SET_POLICE_IGNORE_PLAYER, "ib", [player, onB(0) ? 1 : 0]); }
    if (onB(1) || chB(1)) { if (onB(1) ? (slow || chB(1)) : true) nat(N_SET_EVERYONE_IGNORE_PLAYER, "ib", [player, onB(1) ? 1 : 0]); }
    if (onB(2) ? (slow || chB(2)) : chB(2)) {
      nat(N_SET_PLAYER_WEAPON_DAMAGE_MODIFIER, "if", [player, onB(2) ? 10.0 : 1.0]);
      nat(N_SET_PLAYER_MELEE_WEAPON_DAMAGE_MODIFIER, "if", [player, onB(2) ? 10.0 : 1.0]);
    }
    if (onB(3) ? (slow || chB(3)) : chB(3)) {
      nat(N_SET_PLAYER_HEALTH_RECHARGE_MULTIPLIER, "if", [player, onB(3) ? 12.0 : 1.0]);
      nat(N_SET_PLAYER_HEALTH_RECHARGE_MAX_PERCENT, "if", [player, onB(3) ? 1.0 : 0.5]);
    }
    if (onB(4) ? (slow || chB(4)) : chB(4)) {
      const f = onB(4) ? 1 : 0;      // bullet, fire, explosion, collision, melee, steam, p7, drown
      nat(N_SET_ENTITY_PROOFS, "ibbbbbbbb", [ped, 0, f, f, 0, 0, f, 0, f]);
    }
    if (onB(5) ? (slow || chB(5)) : chB(5)) {
      nat(N_SET_PLAYER_NOISE_MULTIPLIER, "if", [player, onB(5) ? 0.0 : 1.0]);
      nat(N_SET_PLAYER_SNEAKING_NOISE_MULTIPLIER, "if", [player, onB(5) ? 0.0 : 1.0]);
    }
    if (onB(6)) {
      nat(N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE, "ii", [ped, 1]);
      nat(N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN, "ib", [ped, 0]);
    } else if (chB(6) && !(desired & (1 << 12))) {
      nat(N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE, "ii", [ped, 0]);
      nat(N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN, "ib", [ped, 1]);
    }
    if (veh) {
      if (onB(7)) {
        if (slow || chB(7) || veh !== lastPowerVeh) {
          nat(N_SET_VEHICLE_CHEAT_POWER_INCREASE, "if", [veh, 6.0]);
          nat(N_MODIFY_VEHICLE_TOP_SPEED, "if", [veh, 60.0]);
          lastPowerVeh = veh;
        }
      } else if (chB(7)) {
        nat(N_SET_VEHICLE_CHEAT_POWER_INCREASE, "if", [veh, 1.0]);
        nat(N_MODIFY_VEHICLE_TOP_SPEED, "if", [veh, 0.0]);
        lastPowerVeh = 0;
      }
      if (onB(8) && tickCount % 2 === 0) {
        rainbowHue = (rainbowHue + 7) % 360;
        const rgb = hsvToRgb(rainbowHue, 1, 1);
        nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, rgb[0], rgb[1], rgb[2]]);
        nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, rgb[2], rgb[0], rgb[1]]);
      }
      if (onB(9)) {
        nat(N_SET_ENTITY_VISIBLE, "ibb", [veh, 0, 0]);
        lastInvisVeh = veh;
      } else if (chB(9)) {
        nat(N_SET_ENTITY_VISIBLE, "ibb", [veh, 1, 0]);
        lastInvisVeh = 0;
      }
      if (onB(12)) {
        nat(N_SET_VEHICLE_GRAVITY, "ib", [veh, 0]);
        lastAntiGravVeh = veh;
      } else if (chB(12)) {
        nat(N_SET_VEHICLE_GRAVITY, "ib", [veh, 1]);
        lastAntiGravVeh = 0;
      }
      if (onB(13)) {
        if (slow || chB(13)) nat(N_SET_VEHICLE_SIREN, "ib", [veh, 1]);
      } else if (chB(13)) {
        nat(N_SET_VEHICLE_SIREN, "ib", [veh, 0]);
      }
      // At high speed the world collision ahead of the car can still be streaming; the engine then freezes the car dead until it has loaded.
      // Ask it to keep loading collision around this vehicle.
      if (tickCount % 3 === 0) nat(N_SET_ENTITY_LOAD_COLLISION_FLAG, "ibi", [veh, 1, 1]);
      // Crash-through (turbo engine): at 200+ km/h an indestructible car that clips traffic or a prop stops dead in one tick (logged: 80 m/s -> 0
      // with gas held, brake released, collision loaded). While Turbo is on and the gas is held, carry most of that speed through, at most once per
      // 1.2 s so a real wall just bounces the car instead of pinning it.
      {
        const spd = nat(N_GET_ENTITY_SPEED, "i", [veh]).f;
        if (onB(7) && diagPrevSpeed > 30 && spd < diagPrevSpeed * 0.35 && performance.now() - lastCrashThroughMs > 1200 &&
            nat(N_IS_CONTROL_PRESSED, "ii", [0, 71]).i && !nat(N_IS_CONTROL_PRESSED, "ii", [0, 72]).i) {
          lastCrashThroughMs = performance.now();
          nat(N_SET_VEHICLE_FORWARD_SPEED, "if", [veh, diagPrevSpeed * 0.85]);
          if (diagLogged++ < 40) tlog("[trainer stop diag] crash-through: speed " + diagPrevSpeed.toFixed(1) + " -> " + spd.toFixed(1) + ", restored to " + (diagPrevSpeed * 0.85).toFixed(1));
          diagPrevSpeed = diagPrevSpeed * 0.85;
        } else {
          diagPrevSpeed = spd;
        }
      }
      // Super brakes (bit 18): while the brake (S / control 72) is held and the car rolls forward, bleed its forward speed exponentially.
      // Strong but never an instant stop; Space stays a normal handbrake for drifting.
      if (onB(18)) {
        const bnow = performance.now();
        const dt = Math.min(0.1, Math.max(0.005, (bnow - lastBrakeMs) / 1000));
        lastBrakeMs = bnow;
        // Only real, enabled key presses count (the "disabled control" read could report a stuck press and stop the car on its own), the
        // gas must be released, and the brake has to be seen on two ticks in a row before it takes hold.
        const braking = !!nat(N_IS_CONTROL_PRESSED, "ii", [0, 72]).i && !nat(N_IS_CONTROL_PRESSED, "ii", [0, 71]).i;
        brakeHeldTicks = braking ? brakeHeldTicks + 1 : 0;
        if (brakeHeldTicks >= 2) {
          const sv = nat(N_GET_ENTITY_SPEED_VECTOR, "ib", [veh, 1]).v;      // relative to the car: y = forward
          if (sv && sv[1] > 1.0) nat(N_SET_VEHICLE_FORWARD_SPEED, "if", [veh, sv[1] * Math.exp(-3.0 * dt)]);
        }
      }
    }
    // Leaving a vehicle with a per-vehicle effect still active restores the old one
    if (lastInvisVeh && lastInvisVeh !== veh) { nat(N_SET_ENTITY_VISIBLE, "ibb", [lastInvisVeh, 1, 0]); lastInvisVeh = 0; }
    if (lastAntiGravVeh && lastAntiGravVeh !== veh) { nat(N_SET_VEHICLE_GRAVITY, "ib", [lastAntiGravVeh, 1]); lastAntiGravVeh = 0; }
    if (lastPowerVeh && lastPowerVeh !== veh && !onB(7)) lastPowerVeh = 0;
    if (onB(10)) {
      nat(N_SET_GRAVITY_LEVEL, "i", [3]);
    } else if (chB(10)) {
      nat(N_SET_GRAVITY_LEVEL, "i", [(desired & (1 << 16)) ? 2 : 0]);
    }
    if (onB(11) ? (slow || chB(11)) : chB(11)) nat(N_SET_ARTIFICIAL_LIGHTS_STATE, "b", [onB(11) ? 1 : 0]);
    if (onB(14) ? (slow || chB(14)) : chB(14)) nat(N_SET_ALL_RANDOM_PEDS_FLEE, "ib", [player, onB(14) ? 1 : 0]);
    if (onB(15) ? (slow || chB(15)) : chB(15)) nat(N_SET_PLAYER_CAN_BE_HASSLED_BY_GANGS, "ib", [player, onB(15) ? 0 : 1]);
    if (onB(16) ? (slow || chB(16)) : chB(16)) nat(N_SET_CREATE_RANDOM_COPS, "b", [onB(16) ? 0 : 1]);
    if (onB(17)) {
      nat(N_DISPLAY_HUD, "b", [0]);
      nat(N_DISPLAY_RADAR, "b", [0]);
    } else if (chB(17)) {
      nat(N_DISPLAY_HUD, "b", [1]);
      nat(N_DISPLAY_RADAR, "b", [1]);
    }
    appliedMaskB = desiredB;
    Atomics.store(T32, TB_APPLIED, appliedMaskB);

    // ---- Live status for the menu header (floats/ints in the SAB words 32..40) ----
    if (tickCount % 3 === 0) {
      try {
        const ent = veh || ped;
        const pc = nat(N_GET_ENTITY_COORDS, "ib", [ent, 1]).v;
        TF32[32] = pc[0]; TF32[33] = pc[1]; TF32[34] = pc[2];
        TF32[35] = nat(N_GET_ENTITY_HEADING, "i", [ent]).f;
        TF32[36] = nat(N_GET_ENTITY_SPEED, "i", [ent]).f;
        T32[37] = nat(N_GET_ENTITY_HEALTH, "i", [ped]).i;
        T32[38] = nat(N_GET_PED_ARMOUR, "i", [ped]).i;
        T32[39] = nat(N_GET_CLOCK_HOURS, "").i;
        T32[40] = nat(N_GET_CLOCK_MINUTES, "").i;
      } catch (e) {}
    }
    if (inVeh && veh) {
      // The speedometer reads word 36 (speed, m/s) and word 41 (forward speed relative to the vehicle, signed: negative = reversing): refresh both every tick (~50 Hz) while driving.
      try {
        TF32[36] = nat(N_GET_ENTITY_SPEED, "i", [veh]).f;
        TF32[41] = nat(N_GET_ENTITY_SPEED_VECTOR, "ib", [veh, 1]).v[1];
      } catch (e) {}
    }

    appliedMask = desired;
    Atomics.store(T32, 3, appliedMask);

    // 3. Process Ring Buffer Command Queue
    let head = Atomics.load(T32, 64);
    const tail = Atomics.load(T32, 65);
    while (head !== tail) {
      const slotWord = 80 + head * 16;
      try {
        const cmdId = Atomics.load(T32, slotWord);
        if (cmdId > 0) {
          const argInt = T32[slotWord + 1];
          const argF0 = TF32[slotWord + 2];
          const argF1 = TF32[slotWord + 3];
          const argF2 = TF32[slotWord + 4];

          const slotByte = slotWord * 4;
          let end = slotByte + 20;
          while (end < slotByte + 64 && TU8[end] !== 0) end++;
          let str = "";
          if (end > slotByte + 20) {
            const len = end - (slotByte + 20);
            const copy = new Uint8Array(len);
            for (let i = 0; i < len; i++) copy[i] = TU8[slotByte + 20 + i];
            str = dec.decode(copy);
          }

          tlog("[trainer dispatching] cmd=" + cmdId + " argInt=" + argInt + " str=" + str + " ped=" + ped + " veh=" + veh);
          try {
            executeCommand(cmdId, argInt, [argF0, argF1, argF2], str, player, ped, veh);
            tlog("[trainer SUCCESS] cmd=" + cmdId + " executed!");
          } catch (e) {
            console.error("[trainer] command error:", e);
            tlog("[trainer cmd ERROR] cmd=" + cmdId + " error=" + (e.message || e));
          }
          Atomics.store(T32, slotWord, 0);
        }
      } catch (errSlot) {
        tlog("[trainer slot error] " + (errSlot.message || errSlot));
      } finally {
        head = (head + 1) % 16;
        Atomics.store(T32, 64, head);
      }
    }

    try { courseTick(ped, veh); } catch (e) { tlog("[trainer course ERROR] " + (e.message || e) + " " + String(e.stack || "").split("\n")[1]); courseClear(); }

    // 4. Model Loading Poll (vehicles & skins)
    if (pendingModel) {
      if (nat(N_HAS_MODEL_LOADED, "i", [pendingModel]).i !== 0) {
        if (pendingKind === "spawn_vehicle") {
          const oldVeh = veh;
          // Capture player position BEFORE touching any old vehicle!
          const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
          let heading = nat(N_GET_ENTITY_HEADING, "i", [ped]).f;
          if (restoreHeading !== null) { heading = restoreHeading; restoreHeading = null; }
          const v = nat(N_CREATE_VEHICLE, "ivfbbb", [pendingModel, c[0], c[1], c[2] + 0.8, heading, 0, 1, 0]).i;
          if (v) {
            nat(N_SET_PED_INTO_VEHICLE, "iii", [ped, v, -1]);
            spawnedVeh = v; spawnedInfo = { hash: pendingModel, name: pendingLabel, style: pendingStyle };
            nat(N_SET_VEHICLE_ON_GROUND_PROPERLY, "if", [v, 5.0]);
            nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [v, 1, 1, 0]);
            if (oldVeh && oldVeh !== v) {
              nat(N_SET_ENTITY_COORDS, "ivbbbb", [oldVeh, 0, 0, -500.0, 0, 0, 0, 1]);
              nat(N_SET_ENTITY_AS_NO_LONGER_NEEDED, "i", [oldVeh]);
            }
            if (pendingStyle > 0) {
              applyAlgerianVehicleStyling(v, pendingStyle);
            }
            if (desired & (1 << 12)) {
              applyVehicleGod(v, true, ped);
              lastGodVeh = v;
            }
            if (desired & (1 << 21)) nat(N_SET_VEHICLE_TYRES_CAN_BURST, "ib", [v, 0]);
            if (desired & (1 << 20)) nat(N_SET_VEHICLE_REDUCE_GRIP, "ib", [v, 1]);
            postEngineToast((pendingLabel || "Vehicle") + " Spawned & Ready");
          } else {
            postEngineToast("Failed to spawn " + (pendingLabel || "vehicle"));
          }
        } else if (pendingKind === "spawn_ped") {
          const o = nat(N_GET_OFFSET_FROM_ENTITY_IN_WORLD_COORDS, "iv", [ped, 0.0, 2.5, 0.0]).v;
          const hd = nat(N_GET_ENTITY_HEADING, "i", [ped]).f;
          const np = nat(N_CREATE_PED, "iivfbb", [26, pendingModel, o[0], o[1], o[2], hd, 0, 1]).i;
          if (np) {
            if (pendingStyle === 1) {          // bodyguard: joins the player's group, armed
              nat(N_SET_PED_RELATIONSHIP_GROUP_HASH, "ii", [np, joaat("PLAYER")]);
              nat(N_SET_PED_AS_GROUP_MEMBER, "ii", [np, nat(N_GET_PLAYER_GROUP, "i", [player]).i]);
              nat(N_SET_PED_NEVER_LEAVES_GROUP, "ib", [np, 1]);
              nat(N_SET_PED_ACCURACY, "ii", [np, 70]);
              giveWeaponIfValid(np, "WEAPON_CARBINERIFLE", 9999, true) || giveWeaponIfValid(np, "WEAPON_ASSAULTRIFLE", 9999, true);
            } else if (pendingStyle === 2) {   // hostile: armed, left to its own relationship group
              giveWeaponIfValid(np, "WEAPON_PISTOL", 500, true);
            }
            postEngineToast((pendingStyle === 1 ? "Bodyguard: " : "Spawned: ") + pendingLabel);
          } else {
            postEngineToast("Failed to spawn " + pendingLabel);
          }
        } else {
          nat(N_SET_PLAYER_MODEL, "ii", [player, pendingModel]);
          const np = nat(N_PLAYER_PED_ID, "").i;
          nat(N_SET_PED_DEFAULT_COMPONENT_VARIATION, "i", [np]);
          if (!pendingLabel.toLowerCase().startsWith("a_c_")) {
            giveWeapons(np);
          }
          appliedMask = 0; appliedMaskB = 0; // force refresh toggles on new ped
          syncWardrobeState(np);
          savedSkin = pendingLabel; savedSkinHash = pendingModel;
          postEngineToast("Skin: " + (pendingLabel || "Changed"));
        }
        nat(N_SET_MODEL_AS_NO_LONGER_NEEDED, "i", [pendingModel]);
        pendingModel = 0;
        pendingStyle = 0;
      } else if (++pendingFrames > 600) {
        console.warn("[trainer] model load timed out:", pendingModel);
        postEngineToast("Model load timed out");
        pendingModel = 0;
        pendingStyle = 0;
      }
    }

    // 6. Session persistence (restore once after boot, then autosave)
    try { persistTick(ped, veh, desired); } catch (e) {
      if (++persistErrs <= 5) tlog("[trainer persist] error at stage " + restoreStage + ": " + (e && e.message || e));
    }

    // 6b. Story Mode autosave (free roam only)
    if (tickCount % 50 === 0) { try { stripClubTick(ped); } catch (e) {} }
    if (tickCount % 15 === 0) { try { storyAutosaveTick(isPlaying); } catch (e) { if (++persistErrs <= 5) tlog("[trainer story] error: " + (e && e.message || e)); } }

    // 5. Ground Z Settling for Teleports
    if (teleportFrames && ++teleportFrames < 240) {
      const ref = { v: 0 };
      if (nat(N_GET_GROUND_Z_FOR_3D_COORD, "vRbb", [tpX, tpY, 700.0, 0, 0], ref).i !== 0 && ref.v > 0) {
        nat(N_SET_ENTITY_COORDS, "ivbbbb", [veh || ped, tpX, tpY, ref.v + 1.0, 0, 0, 0, 1]);
        teleportFrames = 0;
      }
    } else if (teleportFrames >= 240) {
      teleportFrames = 0;
    }
  }

  // Hook slot 14044 (rage::scrThread::Wait, (i64) -> void)
  try {
    const origWait = tableGet(14044);
    let waitCalls = 0;
    let lastTick = 0, lastWaitT = 0, gapLogged = 0, lastTickMs = 0;

    function hookedWait(info) {
      if (++waitCalls === 1) {
        const sabOk = !!(typeof self !== "undefined" && self.__trainerSab);
        const modOk = !!(typeof Module !== "undefined" && Module.trainerSab);
        console.log("[trainer] hookedWait LIVE on slot 14044!");
        tlog("[trainer] hookedWait LIVE on slot 14044! sab=" + sabOk + " mod=" + modOk);
        getTrainerBuffer();
      }

      // Pause-menu stall fix: audController::UpdateEntityRef makes the audio update thread poll (1 ms sleeps, up to 1 s) until the audio engine
      // thread advances its frame slot; the main thread waits for that thread in audNorthAudioEngine::FinishUpdate, which costs ~145 ms per frame
      // while the pause menu is up. The engine itself stops waiting once that poll has timed out once (byte 12114816 = 1, set only after the
      // 1 s timeout), so set that same byte. audEngine::PartialInit clears it at start-up: set it again every few thousand Waits.
      // Not in Story Mode: this skips the engine's own wait for the audio thread, and Story missions (conversations, scripted audio) hang with the picture frozen and the sound still
      // playing (Repossession, twice). Sandbox keeps the fix; Story keeps the pause-menu lag it had before.
      if (waitCalls % 2000 === 1000 && !storyMode()) {
        try { updateViews(); if (U8[12114816] !== 1) { U8[12114816] = 1; tlog("[trainer] audio entity-ref wait disabled (pause-menu stall fix)"); } } catch (e) {}
      }

      const now = performance.now();
      // Super jump has to be re-armed in every game frame (a tick only runs every >= 20 ms, which skipped frames at 60 fps and made jumps
      // fail), so it is re-applied from here at most every 8 ms.
      if (cachedPlayer >= 0 && T32 && (Atomics.load(T32, 2) & 8) && now - lastSuperJumpMs >= 8) {
        lastSuperJumpMs = now;
        try { nat(N_SET_SUPER_JUMP_THIS_FRAME, "i", [cachedPlayer]); } catch (e) {}
      }
      // Aim crosshair with hit / kill animations, drawn with DRAW_RECT (draw calls last one frame, so this runs every >= 8 ms). Normal state: a thin
      // white four-arm crosshair with a gap that kicks open on each shot. Hit: white X ticks that expand and fade. Kill: bigger red X ticks and a red crosshair.
      if (cachedPlayer >= 0 && now - lastAimDrawMs >= 8 && !storyMode()) {
        lastAimDrawMs = now;
        try {
          const aim = !!(nat(N_IS_CONTROL_PRESSED, "ii", [0, 25]).i || nat(N_IS_PLAYER_FREE_AIMING, "i", [cachedPlayer]).i);
          const shoot = !!nat(N_IS_CONTROL_PRESSED, "ii", [0, 24]).i;
          if (shoot && !aimPrevShoot) aimShotT = now;
          aimPrevShoot = shoot;
          const watching = aimHitEnt && now < aimHitWatch;
          if (aim || shoot || watching || now - aimHitT < 250 || now - aimKillT < 650) {
            if (aim || shoot) {
              const ref = { v: 0 };
              const o = nat(N_GET_ENTITY_PLAYER_IS_FREE_AIMING_AT, "iR", [cachedPlayer], ref);
              if (o.i && o.ci) { aimLastEnt = o.ci; aimLastEntT = now; }
            }
            if (nat(N_HAS_PLAYER_DAMAGED_AT_LEAST_ONE_PED, "i", [cachedPlayer]).i) {
              aimHitT = now;
              nat(N_CLEAR_PLAYER_HAS_DAMAGED_AT_LEAST_ONE_PED, "i", [cachedPlayer]);
              aimHitEnt = (now - aimLastEntT < 500) ? aimLastEnt : 0;
              aimHitWatch = now + 2500;
            }
            if (aimHitEnt && now < aimHitWatch && nat(N_IS_PED_DEAD_OR_DYING, "ii", [aimHitEnt, 1]).i) { aimKillT = now; aimHitEnt = 0; }
            const rect = (dx, dy, w, h, r, g, b, a) => nat(N_DRAW_RECT, "ffffiiii", [0.5 + dx / 1920, 0.5 + dy / 1080, w / 1920, h / 1080, r, g, b, a | 0]);
            const tHit = (now - aimHitT) / 250, tKill = (now - aimKillT) / 650;
            const killing = tKill >= 0 && tKill < 1;
            if (aim || shoot || killing) {
              const kick = Math.max(0, 1 - (now - aimShotT) / 130);
              const gap = 5 + kick * 5, len = 11, th = 2;
              const cr = killing ? 255 : 255, cg = killing ? 60 : 255, cb = killing ? 60 : 255;
              const arms = [[-(gap + len / 2), 0, len, th], [gap + len / 2, 0, len, th], [0, -(gap + len / 2), th, len], [0, gap + len / 2, th, len]];
              for (const [dx, dy, w, h] of arms) rect(dx, dy, w + 2, h + 2, 0, 0, 0, 230);
              for (const [dx, dy, w, h] of arms) rect(dx, dy, w, h, cr, cg, cb, 255);
            }
            if (tKill >= 0 && tKill < 1) {
              const d0 = 14 + 22 * tKill, al = 255 * (1 - tKill);
              for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let k = 0; k < 6; k++) { const d = d0 + k * 5; rect(sx * d, sy * d, 4, 4, 255, 40, 40, al); }
            } else if (tHit >= 0 && tHit < 1) {
              const d0 = 10 + 9 * tHit, al = 255 * (1 - tHit);
              for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let k = 0; k < 3; k++) { const d = d0 + k * 4; rect(sx * d, sy * d, 3, 3, 255, 255, 255, al); }
            }
          }
        } catch (e) {}
      }
      if (lastWaitT && now - lastWaitT > 80 && ++gapLogged <= 40) {
        tlog("[pause diag] script Wait gap " + (now - lastWaitT).toFixed(0) + " ms (last tick took " + lastTickMs.toFixed(1) + " ms)");
      }
      lastWaitT = now;
      if (now - lastTick >= tickGapMs) {
        lastTick = now;
        const tk0 = performance.now();
        try {
          trainerTick();
        } catch (e) {
          console.error("[trainer] wait tick error:", e);
          tlog("[trainer wait tick error] " + (e.message || e));
        }        lastTickMs = performance.now() - tk0;

      }

      if (origWait) return origWait(info);
    }

    const wasmWaitWrapper = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x60, 0x01, 0x7e, 0x00,
      0x02, 0x0d, 0x01, 0x03, 0x65, 0x6e, 0x76, 0x05, 0x6a, 0x73, 0x5f, 0x66, 0x6e, 0x00, 0x00,
      0x03, 0x02, 0x01, 0x00,
      0x07, 0x08, 0x01, 0x04, 0x68, 0x6f, 0x6f, 0x6b, 0x00, 0x01,
      0x0a, 0x08, 0x01, 0x06, 0x00, 0x20, 0x00, 0x10, 0x00, 0x0b
    ]);
    const modWait = new WebAssembly.Module(wasmWaitWrapper);
    const instWait = new WebAssembly.Instance(modWait, { env: { js_fn: hookedWait } });
    tableSet(14044, instWait.exports.hook);
    console.log("[trainer] installed native scrThread::Wait hook on table slot 14044");
    tlog("[trainer] installed hook on slot 14044");
  } catch (err) {
    console.error("[trainer] hook slot 14044 error:", err);
    tlog("[trainer] hook slot 14044 error: " + err.message);
  }
}
