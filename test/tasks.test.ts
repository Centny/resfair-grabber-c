import { SharedQueue, default as init } from '../lib/tasks';
import { expect } from 'chai';
import 'mocha';

describe('Task Queue', () => {
    init();
    it('should request well', (done: MochaDone) => {
        SharedQueue.doWeb({
            mid: "a",
            url: "http://www.baidu.com",
            onDone: (data: string, err: Error): any => {
                expect(err, "having error").equal(undefined);
                done();
            }
        });
    });
    it('should wait request well', (done: MochaDone) => {
        var donc = 11;
        var beg = new Date().getTime();
        var done_ = () => {
            donc--;
            if (donc > 0) {
                return;
            }
            var used = new Date().getTime() - beg;
            if (used < 4000) {
                done("not queue by " + used);
            } else {
                done();
            }
        };
        SharedQueue.max = 1;
        SharedQueue.delay["beg"] = 1000;
        SharedQueue.delay["wait"] = 1000;
        for (var i = 0; i < 5; i++) {
            SharedQueue.doWeb({
                mid: "beg",
                url: "http://www.baidu.com",
                onDone: (data: string, err: Error): any => {
                    expect(err, "having error").equal(undefined);
                    done_();
                }
            });
        }
        //
        for (var i = 0; i < 5; i++) {
            SharedQueue.doWeb({
                mid: "wait",
                url: "http://www.baidu.com",
                onDone: (data: string, err: Error): any => {
                    expect(err, "having error").equal(undefined);
                    done_();
                }
            });
        }
        SharedQueue.doWeb({
            mid: "not found",
            url: "http://www.baidu.com",
            onDone: (data: string, err: Error): any => {
                expect(err, "having error").equal(undefined);
                done_();
            }
        });
    });
    it('should reponse fail', (done: MochaDone) => {
        SharedQueue.doWeb({
            mid: "not found",
            url: "http://kuxiao.cn/sss",
            onDone: (data: string, err: Error): any => {
                console.log(err);
                expect(err, "having error").not.equal(undefined);
                done();
            }
        });
    });
    it('should reponse error', (done: MochaDone) => {
        SharedQueue.doWeb({
            mid: "not found",
            url: "http://127.0.0.1:28322/sss",
            onDone: (data: string, err: Error): any => {
                console.log(err);
                expect(err, "having error").not.equal(undefined);
                done();
            }
        });
    });
});