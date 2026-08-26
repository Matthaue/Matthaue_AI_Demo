# -*- coding: utf-8 -*-
"""腾讯云 COS XML API 临时密钥直传脚本（ima 知识库入库用）
用法: python upload_cos.py <credential_json>
凭证 JSON 字段: local, token, secret_id, secret_key, start_time, expired_time,
               bucket, region, cos_key, content_type
"""
import sys
import json
import hmac
import hashlib
import urllib.request
import urllib.parse


def _hmac_sha1(key: str, msg: str) -> str:
    return hmac.new(key.encode('utf-8'), msg.encode('utf-8'), hashlib.sha1).hexdigest()


def _sha1_hex(s: str) -> str:
    return hashlib.sha1(s.encode('utf-8')).hexdigest()


def make_authorization(secret_id: str, secret_key: str, method: str, uri: str,
                       params: dict, headers: dict, key_time: str) -> str:
    """按 COS XML API 规范生成 Authorization 头"""
    # 参数与头均按 key 小写字典序拼接
    param_items = sorted((k.lower(), v) for k, v in params.items())
    header_items = sorted((k.lower(), v) for k, v in headers.items())

    def q(s: str) -> str:
        return urllib.parse.quote(s, safe='')

    def join_kv(items):
        # COS 规范：FormatString 中 key 与 value 均需 UrlEncode
        return '&'.join(f"{q(k)}={q(v)}" for k, v in items)

    http_params = join_kv(param_items)
    http_headers = join_kv(header_items)
    param_list = ';'.join(k for k, _ in param_items)
    header_list = ';'.join(k for k, _ in header_items)

    sign_key = _hmac_sha1(secret_key, key_time)
    http_string = f"{method.lower()}\n{uri}\n{http_params}\n{http_headers}\n"
    string_to_sign = f"sha1\n{key_time}\n{_sha1_hex(http_string)}\n"
    signature = _hmac_sha1(sign_key, string_to_sign)

    return (
        f"q-sign-algorithm=sha1"
        f"&q-ak={secret_id}"
        f"&q-sign-time={key_time}"
        f"&q-key-time={key_time}"
        f"&q-header-list={header_list}"
        f"&q-url-param-list={param_list}"
        f"&q-signature={signature}"
    )


def main():
    cred_path = sys.argv[1]
    with open(cred_path, encoding='utf-8') as f:
        c = json.load(f)

    host = f"{c['bucket']}.cos.{c['region']}.myqcloud.com"
    uri = '/' + c['cos_key']
    key_time = f"{c['start_time']};{c['expired_time']}"

    headers = {
        'Host': host,
        'Content-Type': c.get('content_type', 'text/markdown'),
        'x-cos-security-token': c['token'],
    }
    auth = make_authorization(c['secret_id'], c['secret_key'], 'PUT', uri, {}, headers, key_time)
    headers['Authorization'] = auth

    with open(c['local'], 'rb') as f:
        body = f.read()

    # 路径逐段编码，保留 /
    encoded_path = '/'.join(urllib.parse.quote(seg, safe='') for seg in c['cos_key'].split('/'))
    url = f"https://{host}/{encoded_path}"

    req = urllib.request.Request(url, data=body, headers=headers, method='PUT')
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            print(f"OK {resp.status} media_id={c.get('media_id', '')}")
    except urllib.error.HTTPError as e:
        print(f"FAIL HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:500]}")
        sys.exit(1)
    except Exception as e:
        print(f"FAIL {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
