import { Inject, Post, Provide } from '@midwayjs/decorator';
import { Context } from 'egg';
import { CoolController, BaseController } from 'midwayjs-cool-core';
import { ICoolWxPay } from 'midwayjs-cool-wxpay';
import { parseString } from 'xml2js';

/**
 * 支付示例
 */
@Provide()
@CoolController()
export class DemoPayController extends BaseController {
  // 微信支付
  @Inject('cool:wxpay')
  wxpay: ICoolWxPay;

  @Inject()
  ctx: Context;

  /**
   * 扫码支付
   */
  @Post('/wx')
  async wx() {
    const orderNum = await this.wxpay.createOrderNum();
    const data = await this.wxpay.getInstance().unifiedOrder({
      out_trade_no: orderNum,
      body: '测试微信支付',
      total_fee: 1,
      trade_type: 'NATIVE',
      product_id: 'test001',
    });
    return this.ok(data);
  }

  /**
   * 微信支付通知回调
   */
  @Post('/wxNotify')
  async wxNotify() {
    let data = '';
    this.ctx.req.setEncoding('utf8');
    this.ctx.req.on('data', chunk => {
      data += chunk;
    });
    const results = await new Promise((resolve, reject) => {
      this.ctx.req.on('end', () => {
        parseString(data, { explicitArray: false }, async (err, json) => {
          if (err) {
            return reject('success');
          }
          const checkSign = await this.wxpay.signVerify(json.xml);
          if (checkSign && json.xml.result_code === 'SUCCESS') {
            // 处理业务逻辑
            console.log('微信支付成功', json.xml);
            return resolve(true);
          }
          return resolve(false);
        });
      });
    });
    if (results) {
      this.ctx.body =
        '<xml><return_msg>OK</return_msg><return_code>SUCCESS</return_code></xml>';
    }
  }
}