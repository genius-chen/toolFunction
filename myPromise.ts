/*
 * @Author: your name
 * @Date: 2021-12-07 19:27:56
 * @LastEditTime: 2022-03-04 11:00:22
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \oc-front-basec:\Users\Administrator\Desktop\小知识\js\myPromise.ts
 */
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function resolvePromise(promise, item, resolve, reject) {
	if (promise === item) reject(new TypeError('Chaining cycle detected for promise #<Promise>'));

	// 原生promise处理方式
	if( typeof item === 'object' || typeof item === 'function'){
		if(item === null) {
			return resolve(item);
		}
		let then;
		try{
			then = item.then;
		}catch(e){
			return reject(e);
		}

		if(typeof then === 'function'){
			let called = false;
			try{
				then.call(item, (temp) => {
					if(called) return;
					called = true;
					resolvePromise(promise, temp, resolve, reject);
				}, (e) => {
					if(called) return;
					called = true;
					reject(e);
				})
			}catch(e){
				if(called) return;
				console.log(e)
			}
		}else{
			resolve(item)
		}
	}else{
		resolve(item)
	}

	// 满足promiseA+测试的简易方式
	if (item instanceof MyPromise) {
		item.then(resolve, reject);
	} else {
		resolve(item);
	}
}

class MyPromise {
	constructor(executor) {
		try{
			executor(this.resolve, this.reject);
		}catch(error){
			this.reject(error)
		}
	}

	status = PENDING;
	value = null;
	reason = null;

	onFulfilledCallback = [];
	onRejectedCallback = [];

	static resolve = (param) => {
		if(param instanceof MyPromise){
			return param;
		}

		return new MyPromise(resolve => {
			resolve(param);
		})
	}

	static reject = (param) => {
		return new MyPromise((resolve, reject) => reject(param))
	}

	resolve = (value) => {
		if (this.status === PENDING) {
			this.status = FULFILLED;
			this.value = value;

			while (this.onFulfilledCallback.length) {
				this.onFulfilledCallback.shift()(value);
			}
		}
	};
	reject = (reason) => {
		if (this.status === PENDING) {
			this.status = REJECTED;
			this.reason = reason;

			while (this.onRejectedCallback.length) {
				this.onRejectedCallback.shift()(reason);
			}
		}
	};

	then(onFulfilled, onRejected) {
		onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
		onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw reason};
		if (this.status === FULFILLED) {
			onFulfilled(this.value);
		} else if (this.status === REJECTED) {
			onRejected(this.reason);
		} else {
			this.onFulfilledCallback.push(onFulfilled);
			this.onRejectedCallback.push(onRejected);
		}

		const promise2 = new MyPromise((resolve, reject) => {
			if (this.status === FULFILLED) {
				queueMicrotask(() => {
					try{
						const temp = onFulfilled(this.value);
						resolvePromise(promise2, temp, resolve, reject);
					}catch(e){
						reject(e);
					}
				})
			} else if (this.status === REJECTED) {
				queueMicrotask(() => {
					try {
					  // 调用失败回调，并且把原因返回
					  const temp = onRejected(this.reason);
					  // 传入 resolvePromise 集中处理
					  resolvePromise(promise2, temp, resolve, reject);
					} catch (error) {
					  reject(error)
					} 
				  });
			} else {
				this.onFulfilledCallback.push(() => {
					// ==== 新增 ====
					queueMicrotask(() => {
					  try {
						// 获取成功回调函数的执行结果
						const x = onFulfilled(this.value);
						// 传入 resolvePromise 集中处理
						resolvePromise(promise2, x, resolve, reject);
					  } catch (error) {
						reject(error)
					  } 
					}) 
				  	});
				this.onRejectedCallback.push(() => {
					// ==== 新增 ====
					queueMicrotask(() => {
					  try {
						// 调用失败回调，并且把原因返回
						const x = onRejected(this.reason);
						// 传入 resolvePromise 集中处理
						resolvePromise(promise2, x, resolve, reject);
					  } catch (error) {
						reject(error)
					  } 
					}) 
				});
			}
		})
		return promise2;
	}
}


