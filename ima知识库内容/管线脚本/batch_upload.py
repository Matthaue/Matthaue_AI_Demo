# -*- coding: utf-8 -*-
"""批量上传剩余 10 个条目到 ima COS（凭证来自 create_media 并行调用结果）"""
import sys
import os
import urllib.request
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from upload_cos import make_authorization

OUT = r'C:\Users\11278\WorkBuddy\2026-08-25-14-34-43\ima_export'
BUCKET = 'ima-share-kb-1258344701'
REGION = 'ap-shanghai'
ST = '1787643148'
ET = '1787686348'

CREDS = [
    {
        'name': '英雄_捷风_Jett', 'local': '英雄_捷风_Jett.md',
        'media_id': 'markdown_280da25f5305f3e507747d46abb59da7_80325e1d0a63f10bfbe92d75530bf11d7497915668919346',
        'token': 'FdGqle74LcMjlkJ37E1n62JSpt7p7mra5f70b1fc627bbec63e7e4335368d25f2eeeSPuQ6AgOCW0ji5ZyES2RtLlICDLqGrzDhrqK8SogDfkhirCIsEekyZ566WPH9XEG3CxRiol2DsW3OBLbxUbtIJi9aIRLMRjoFRCIn3rmXYF6pOQkFeZKaG_elo5Y2Qos1PB7ZvxyuA4hgpPWQHRdVIcTerpi_lQAdGCFvI3_N0byw9N0Um5O-LCvLVcegMNDH7u-afl9r7Q_A6SMElAKHQwOkDtZeAz8nJnjqqBpv2BlqlHKoCnlzSKU_a82O3qgPUsnXBp5Z6czfBuSrMYQ999xCgqi_GXCPRBxTcFkvCx_wRlYK9lcBHgk_Kb7yiGv_ndmp5YskiEY8ySPWY7Gbz6bmTpRA89gXa-zSPttK9BKUWi8T1iP7e-hAUeWc3pmBWY709oA-AA2S41g3Wff_YbP-8GUyPTahV9LTLkAaTVGHA9EhYjxZ0p_cXIQzDZgc3MDzANIfNeSoyEcW4MIGkCM9SNijJL7j4X7K_V9qxthqaOjIsBHwm1ePJaj9oflQvgNAGLIZMqMeSbjiU1hXfnD7Ox5XZbbUxpqCbM8u6wIc_dGP5s856AVNjzuPQpPPaJ6nKoo4Nt6u0zopFid3hS7LOQDtZYRFeoCncgEqYJQHCAeusawAg_lenNUtcD24WvykXET4GooH6yB1KnzVG192z52TlmkqNzx8ISqPDPI5FxPsgyTmb6yWRfTInUUkQpQ0Ly8l7SaiBGW8o-Of5iFj9NWP7GeuvyAq-F5vBJGh-gw3JZxy1mBLaymRbM6cREtaRfhzPLu6PUvzoDQS2-eJTThwNWD5G_pM-_g',
        'secret_id': 'AKIDBPy6egx6fQdTn0eh4z8uD6k2Q70CANC9niCjB_t37EmzCI_LoxbsfxoPUmC2SQGd',
        'secret_key': 'Uh7ToO3TevQrQtDSDwsUpx4yXTJwuEYuc6tjQp890Qg=',
        'cos_key': '5/dzEZKa8CwRJyne1aSN7N4D/file_manager/01a037d5b8d5730ab46610740bd4d35d.md',
    },
    {
        'name': '英雄_贤者_Sage', 'local': '英雄_贤者_Sage.md',
        'media_id': 'markdown_280da25f5305f3e507747d46abb59da7_6f6a06fd1970fb814c080c638a31722a7497915668919346',
        'token': '4AnAcXfNarCEzVFhApsoNqJ0xV3q1mKae4050b9df146cadde906e347eb4a28adX2_YZx7Mj8gDStSHezWXT8QYWzf7j0Tt0RLSqUSIB7HFWh7KGcngUDLIvcYH-XBsiKukdp0d7Y90il3eyW86i5wdgIDhrBAfPPc2lb3a0ULgOYUuhQcI-GPWtJ05wszIEFRdyL7JBP4u3QYVl7mrOGS-XWYdW91m6A_MYQ1GchtzqL1JRew3ZvKEqjsULRkGEbdAu2KP0RGUBtXgBVYhTP2o5yvhkUmmti_-2VyDL2aYQHbiOL9f953uzuy2aVWBPqCJ2lOznnMjeNcr_9gYypENMW21rcYGtbrn9ip_5ThK_Fhqp0E1ReR8btATBnSUvN0gnghcvhMXHbvQnpbZsAW6JkfVoqxkXXhC8vpc46GoSUYZ0RnCIg1wh6XMANQFKBZRTlE3Ep7e9qWumRA4ANkEf4k5mec8AYI1k7BfwWzoN_zyqBGHcNV_ZOnZol1orYz2DkAND_VybFzWeaXIGcaZtLuIvt0AvLCR_QylCZcSWaomSlDcLUuU7rrf5sokkiRPRmVra-OPicCv3GL8OKH_9GJVoAZHa97pTi7C8AhLXRY9LNyrHEQJkO6dGdLuyMN6tmoP4MnnvWV_dVxi_yqv8QiF7KJjEopSgmtFi00cbScltntCgld7V_nwCB2wgEGB63yHJyIBWWlljHSnbnn9E2wKb2uuNSSD9KusfKUBr1bLFvUm_xtd6Z3WnJR-A_osnNFlrYV_I71dGY_P7pkePGuF95Ft5-D4SUGJ0iUQ1Hv9MdEJWUBUM9GU2PQZQ4S652bIAAxVXj7tL4aQAl-VqSNPwl9UzfME7vOejbY',
        'secret_id': 'AKIDVPGP0jfLGyJ7wgdtLXMRnUeSvrBH-kSdZefpwUqpeTc5jXXdJaYCN6buktPe20BD',
        'secret_key': '3oojAu9i9c7jGSs0HxhUC0n8ud7iz9TWlG8rhMlL86A=',
        'cos_key': '5/dzEZKa8CwRJyne1aSN7N4D/file_manager/01a037d5b8de7f39b8c49eb55632236f.md',
    },
    {
        'name': '英雄_蕾娜_Reyna', 'local': '英雄_蕾娜_Reyna.md',
        'media_id': 'markdown_280da25f5305f3e507747d46abb59da7_cf0562e94c906fdd6fcd8feeedabd6627497915668919346',
        'token': '4AnAcXfNarCEzVFhApsoNqJ0xV3q1mKa1a40dc6c3d2470550482789caaa38a7dX2_YZx7Mj8gDStSHezWXT8QYWzf7j0Tt0RLSqUSIB7HFWh7KGcngUDLIvcYH-XBsiKukdp0d7Y90il3eyW86i5wdgIDhrBAfPPc2lb3a0ULgOYUuhQcI-GPWtJ05wszIEFRdyL7JBP4u3QYVl7mrOGS-XWYdW91m6A_MYQ1GchtzqL1JRew3ZvKEqjsULRkGEbdAu2KP0RGUBtXgBVYhTP2o5yvhkUmmti_-2VyDL2aYQHbiOL9f953uzuy2aVWBPqCJ2lOznnMjeNcr_9gYypENMW21rcYGtbrn9ip_5ThK_Fhqp0E1ReR8btATBnSUvN0gnghcvhMXHbvQnpbZsEbmdMOqjPrUK9-BJuiT6NJsNL-JAg4USDDtn0WnrBvoaQVFjRnavokpWRaiQbNamN48Sn63epNJQFwWiWnuQqrqAjqo8PcmQ0Vd8Z0k7K_aJIg7puee81yEq-gHIGb0fKd8z0XUQOB9qP96zo7B3jaXbsdpGNfGgDuHduBdSWXfFX7ySeUqWgFmudKWGyshRSlOwf4NnxT6m-OPkHBxPn_ufgK3QXTS-b_2fpMPxjlEpo_KzJgiYgP92NeZ3EH_bGFuCR7lxgFoL5dcwc9ZaU7b4lA6KFov_bbHxdYNH42aHgVvbqE9iT_hz9B-3upKrWIvwfXEoENOBYJNhCd_8GHbbtLdDCo2wiWLHeR0AS0JvovGoh-wN3H7tiBU2dHjqVLfNDGg3mqcSSSNzXwskGkpa5kRYLb30nfje_4VLG_UPVIMwNWiB977Wy4cDRXFh7OqVHhK8JTilys9kZaOj9M',
        'secret_id': 'AKIDFUMXRcERlG8twU9MESQfznDUQnoKZ-WkGXrXLKKUd20x1GHMHoHuI_x-Ra3RKXMP',
        'secret_key': 'oS8YECp8YRxNaq4Z16rZ+0bd2S30fE1bP4fTWXm9gt8=',
        'cos_key': '5/dzEZKa8CwRJyne1aSN7N4D/file_manager/01a037d5b8d9771a9776287e889d4a88.md',
    },
    {
        'name': '地图_亚海悬城_Ascent', 'local': '地图_亚海悬城_Ascent.md',
        'media_id': 'markdown_280da25f5305f3e507747d46abb59da7_e65548e9b9dc3aa6f6b3ae4b1f27ee1a7497915668919346',
        'token': '4AnAcXfNarCEzVFhApsoNqJ0xV3q1mKa22cc7a3c99293743afe2ff2f9953f9c1X2_YZx7Mj8gDStSHezWXT8QYWzf7j0Tt0RLSqUSIB7HFWh7KGcngUDLIvcYH-XBsiKukdp0d7Y90il3eyW86i5wdgIDhrBAfPPc2lb3a0ULgOYUuhQcI-GPWtJ05wszIEFRdyL7JBP4u3QYVl7mrOGS-XWYdW91m6A_MYQ1GchtzqL1JRew3ZvKEqjsULRkGEbdAu2KP0RGUBtXgBVYhTP2o5yvhkUmmti_-2VyDL2aYQHbiOL9f953uzuy2aVWBPqCJ2lOznnMjeNcr_9gYypENMW21rcYGtbrn9ip_5ThK_Fhqp0E1ReR8btATBnSUvN0gnghcvhMXHbvQnpbZsMC3yt9AVLZN5f0uDB0dinBt8xIjCG-Ki7g5hhByFua7idxyXpFewzK-TXwVr63DHsZrIUmbnd5GBV81UttJGMGpMDV1aN6f8eojJ2cIuM9Cx04uf3sydIXkTD1kVGYhCSJx6OwvUHiLnq91MAMWadDAdaRiXWyLHi2YdHFcMBg1aRA9gLF6Q7HmsBtLA3Sl67Kh_Mj85NC3YVA_gqgMhuq3UtxUVTTLghrWjk_S2rg7dxRwYgbCDuj8mDk3J8EDR3HsxBd4klytdXw7x1TfIOT4k4eLwXMGw_1dhufByIP4h7D64RydlRORpRJI5GrOuKrQDvhKnCrbZw0QpjjXdhk_ijm4dd9OBOvmY6YOOLNXrcQt2i2JbMkbJW1sm4ym7FTY36DkYcu9Mka7ibXYpL4s_uljgz6dWDaemyp4GX2KUCVqYn6jZYmQf8qOO63uzW3_Ebxyv0X06jnUNVnfEV0',
        'secret_id': 'AKIDfr0R0O1B7JHEUP-tlNl131SdqszfDS7lkEZfpLMJVFQZDfl6mDS7LE6-JJKweij1',
        'secret_key': 'rSsAbFC6rRoThy8NzIFRnCg42CFeWXkxZ0oGwOauxH4=',
        'cos_key': '5/dzEZKa8CwRJyne1aSN7N4D/file_manager/01a037d5b8ea76bb9376ea7c6c67010b.md',
    },
    {
        'name': '地图_隐世修所_Haven', 'local': '地图_隐世修所_Haven.md',
        'media_id': 'markdown_280da25f5305f3e507747d46abb59da7_60eb4db6e689c8d9b0c3bb61937862c97497915668919346',
        'token': '4AnAcXfNarCEzVFhApsoNqJ0xV3q1mKa1d5bfc11542586071b132d6d44514e43X2_YZx7Mj8gDStSHezWXT8QYWzf7j0Tt0RLSqUSIB7HFWh7KGcngUDLIvcYH-XBsiKukdp0d7Y90il3eyW86i5wdgIDhrBAfPPc2lb3a0ULgOYUuhQcI-GPWtJ05wszIEFRdyL7JBP4u3QYVl7mrOGS-XWYdW91m6A_MYQ1GchtzqL1JRew3ZvKEqjsULRkGEbdAu2KP0RGUBtXgBVYhTP2o5yvhkUmmti_-2VyDL2aYQHbiOL9f953uzuy2aVWBPqCJ2lOznnMjeNcr_9gYypENMW21rcYGtbrn9ip_5ThK_Fhqp0E1ReR8btATBnSUvN0gnghcvhMXHbvQnpbZsODhP7IAKwjW7OqyRG93AbykxqRRu_diiLhKXEq3yVYI3nzfV0M4sqGUNKznfTbEdERIRQO4Ih0UKC-itzjkziPkl934inMqSF4grt0gxp5XEmTyc-mT9jQgS9XkmSr4Eeu_9VBDK_v_X-qjYr4x403TvWejmzA6LU2QF1dvF-dg9bmap03FcIHjDf72tmR8JP8QhLJtzkxl2oqJsLCP_RzGcO64jeUeWNDA2bcsLYr2mTrL15udphVp9TeLGDSzG2TlcSVh-Fx4rZpoOMp7u6_d9Vcz6d5Nzu2dO2s_HOQ_0VzDzPYyLhMXTLYh1qpdBcAIFT76h_fNaPZ94oRQIQqhmACCXoo8c-Hpnx5AkaDXmcvj7wDbCx7Wkrhe5DWfIgAOIUo90e1P1A8bt3kBawmrhudRmEaGaLJ_-erzUHvq3zlrH-DJBtRcmnHC5osjrrORH9w_24WxvxwCOyfs8tI',
        'secret_id': 'AKIDqNb2ySkrP3V8zjcT3_5pF9XmslfFOdSYMO24MHTU22iynxOUg6Ry4Brah4VWuYZZ',
        'secret_key': 'ztiHFgm8RnScxGXRNz7bUGBKUC7SuF+g05+2y8eVJEo=',
        'cos_key': '5/dzEZKa8CwRJyne1aSN7N4D/file_manager/01a037d5b8eb7d3b8520cb4e22653c8f.md',
    },
    {
        'name': '地图_霓虹町_Split', 'local': '地图_霓虹町_Split.md',
        'media_id': 'markdown_280da25f5305f3e507747d46abb59da7_7e7e5d5f4994658ad745c71dae5d8a537497915668919346',
        'token': 'FdGqle74LcMjlkJ37E1n62JSpt7p7mradd2921838aca6514a75952adeb0f955deeeSPuQ6AgOCW0ji5ZyES2RtLlICDLqGrzDhrqK8SogDfkhirCIsEekyZ566WPH9XEG3CxRiol2DsW3OBLbxUbtIJi9aIRLMRjoFRCIn3rmXYF6pOQkFeZKaG_elo5Y2Qos1PB7ZvxyuA4hgpPWQHRdVIcTerpi_lQAdGCFvI3_N0byw9N0Um5O-LCvLVcegMNDH7u-afl9r7Q_A6SMElAKHQwOkDtZeAz8nJnjqqBpv2BlqlHKoCnlzSKU_a82O3qgPUsnXBp5Z6czfBuSrMYQ999xCgqi_GXCPRBxTcFkvCx_wRlYK9lcBHgk_Kb7yiGv_ndmp5YskiEY8ySPWY49cAjpqViT7ZVkQvL9NB02LAphRpgeOiAEuf9wgRN86NmfKbedkwXPEN64dcLGVWH4XyaUxt9WOUfspAl3qjDGeLOVg92zxJ4XR-7Z_0ivsySikyWCAxYX7a8zN_9XBsl7w-sdSgnYJorhTqTY9AgEE25MwOFASkOd8zOEBLJMK37subrfGOSejaOrDhOzkVbDR4iagDReHUK66mZxXi4D1bnggsAf1riVuLZrFTy2y8nSCiVsCYVMf5miwgxvpyT9bwWkTHyOWVUQWEp_CEtLTTOAuv242E18Kkl48Xg1Jj-dCvyN7UCBINHtrJnHsBGKgk7Rrl-X-9sfzP4KK50celwBpV20aB0DkqMuYxSnY0CzUZG9k5oF5Pkt2Y0LaKj_8t7G2Tn8SyGT5yXEN9j7GAphM4XMJ2oxK9XCVIzhp8OhQONOFCKRQNFfBAHUVv7ZxX_CbS-omt5lJjI4rSAk',
        'secret_id': 'AKID3grajIG4sJvy5f-ILB1Ek13rZIF6LmfUqYWwQdsvknPZeX4ytedivRhcrCmj18HP',
        'secret_key': 'XTbzkliigrgCW/eTlf+zowW5eCHEXbM8dqI/+vDJoNA=',
        'cos_key': '5/dzEZKa8CwRJyne1aSN7N4D/file_manager/01a037d5b8e477ca9ce14d20330ec225.md',
    },
    {
        'name': '地图_森寒冬港_Icebox', 'local': '地图_森寒冬港_Icebox.md',
        'media_id': 'markdown_280da25f5305f3e507747d46abb59da7_590d6b42326d219e6630a886fcd2f6147497915668919346',
        'token': 'FdGqle74LcMjlkJ37E1n62JSpt7p7mra7dd3164f5d527f0b067fc1bd939708d1eeeSPuQ6AgOCW0ji5ZyES2RtLlICDLqGrzDhrqK8SogDfkhirCIsEekyZ566WPH9XEG3CxRiol2DsW3OBLbxUbtIJi9aIRLMRjoFRCIn3rmXYF6pOQkFeZKaG_elo5Y2Qos1PB7ZvxyuA4hgpPWQHRdVIcTerpi_lQAdGCFvI3_N0byw9N0Um5O-LCvLVcegMNDH7u-afl9r7Q_A6SMElAKHQwOkDtZeAz8nJnjqqBpv2BlqlHKoCnlzSKU_a82O3qgPUsnXBp5Z6czfBuSrMYQ999xCgqi_GXCPRBxTcFkvCx_wRlYK9lcBHgk_Kb7yiGv_ndmp5YskiEY8ySPWY3nNzWZ_-WhzPUGqZmiUi4aOgqhSmvENyKDfA4R3jJxTJ2-V7FMXEP_tZHr1Irjv4MHilwsmjzu0QbeSgyx-3xmGy7MYwKbQvSYwOTFb4trULU0Q9SRptILSz-mdBUwlgJZwkHzGV2kpyjrpt9xC2o1LHEirYeGo6DTJxwi9VyxmN_qjO8y2fHqacOOnBuq-M-hbMFFKj5m5PEObVTBnVRfDSTzp5_cOLvjbOYzhJRv_5G9c93Wwc3bVqt8BjhE9pJOhEbIr6mPJheD_VbCC3VK_-ON7iXM5H2jhVzAZrmF_2chftpi1ERxdlASOkQf5yUvxaeLGCipaooD_ooutglxqnJnYy8VfdyG0E3hVlvtNNs-DqNpEgYZQ9DQZ56PNAprSTpniS_1kZCl1OoG5eYezmGtYqW0oxu46mAAWsMKqMUf4Y8B8LGc2e8hjU1WNqTMPPXq7g4sfoGSogQBth6A',
        'secret_id': 'AKIDDYSwATbIbkHJv7GclC1QYqCQyWDvkItzLKYvTpT2Ai5WtDtxhdBBYxsVipKEP8nz',
        'secret_key': 'N40NI5E4xVIePsUqubHX/BGQdeoxO0U0X3UO2ifqCew=',
        'cos_key': '5/dzEZKa8CwRJyne1aSN7N4D/file_manager/01a037d5b8d67c009b4c65d20be7b6ef.md',
    },
    {
        'name': '地图_微风岛屿_Breeze', 'local': '地图_微风岛屿_Breeze.md',
        'media_id': 'markdown_280da25f5305f3e507747d46abb59da7_5df1ec08960c8f869e78f76f1b28a3967497915668919346',
        'token': 'FdGqle74LcMjlkJ37E1n62JSpt7p7mra35b1a86ff2f70a1d018c3bb2a940af46eeeSPuQ6AgOCW0ji5ZyES2RtLlICDLqGrzDhrqK8SogDfkhirCIsEekyZ566WPH9XEG3CxRiol2DsW3OBLbxUbtIJi9aIRLMRjoFRCIn3rmXYF6pOQkFeZKaG_elo5Y2Qos1PB7ZvxyuA4hgpPWQHRdVIcTerpi_lQAdGCFvI3_N0byw9N0Um5O-LCvLVcegMNDH7u-afl9r7Q_A6SMElAKHQwOkDtZeAz8nJnjqqBpv2BlqlHKoCnlzSKU_a82O3qgPUsnXBp5Z6czfBuSrMYQ999xCgqi_GXCPRBxTcFkvCx_wRlYK9lcBHgk_Kb7yiGv_ndmp5YskiEY8ySPWY5jIiGwEIunMMgxJoiuxtUtjJVtdT2TSN9A5p2oOo1Sc7Lz9VyC1lINe-Y36MK-oFHIJ7dWcyyJBtzoQ0dod0UeVJaWKc-sm88G4aNBSgJoP8lXbrMDcDyL14xnH54rRe2C4TLQCobBY8gwaULe8zyHFtgLrxcXX0xAV_DC09qcA8BXVnxSHlsBIOLJXkI3AfjpE9jOyBzTXLUG4ciGdMT-Aq6ZHPPnH--YCibdHliGGQUDA2hUSH-cAuaJl4ZKMhVxsUWolLiu3Kq2UiV9Irr437spmMkFU7Eo5g85dMQMabwaSb__9LSkAgRw8LgQhT5vNerjQlKt7L0e1I7ZKQLJV9Wd255IqXw3LfvN9lXfcOUIX5awtsRYP39Qvc2Snfux1QNfg5fg-ZhdSjPz7Ch8FwpwmnOo_U_L93pqmUNR3W95jju573mnK-wV4Fjemrc-2y4W3zz9DGIoBWbpr62c',
        'secret_id': 'AKIDAou666O2BiMqMR8Bn1ps3aBXx2lg18TlQ0XQPxierQG5ECADId-pSmZ5E7FjE2uw',
        'secret_key': 'UWL0q0ZX7z3A6hGzlk81NMlhMJ+cJpvuQ/OoigwJMDs=',
        'cos_key': '5/dzEZKa8CwRJyne1aSN7N4D/file_manager/01a037d5b8ef75778e445bca7603aa03.md',
    },
    {
        'name': '地图_莲华古城_Lotus', 'local': '地图_莲华古城_Lotus.md',
        'media_id': 'markdown_280da25f5305f3e507747d46abb59da7_36908b30f74ef4e8738c0cddb19e34b27497915668919346',
        'token': '4AnAcXfNarCEzVFhApsoNqJ0xV3q1mKa7fe17b3cc00a054a1cd55f1328cbf665X2_YZx7Mj8gDStSHezWXT8QYWzf7j0Tt0RLSqUSIB7HFWh7KGcngUDLIvcYH-XBsiKukdp0d7Y90il3eyW86i5wdgIDhrBAfPPc2lb3a0ULgOYUuhQcI-GPWtJ05wszIEFRdyL7JBP4u3QYVl7mrOGS-XWYdW91m6A_MYQ1GchtzqL1JRew3ZvKEqjsULRkGEbdAu2KP0RGUBtXgBVYhTP2o5yvhkUmmti_-2VyDL2aYQHbiOL9f953uzuy2aVWBPqCJ2lOznnMjeNcr_9gYypENMW21rcYGtbrn9ip_5ThK_Fhqp0E1ReR8btATBnSUvN0gnghcvhMXHbvQnpbZsAtqCOCeiqQhSO0M5hiBcZaQhAifX0zhFm1EFzb5CwzTNq2vE3U4fh-IfRRYXQdWu5sf_mmw-zjuTZEoMWDqbXXczFwwSqH5PLCF_TzX7YZ9jXNC9zKz0DjN7-wPCoTt0theEsnz0epWUu9bY-RBXOmAemn1meR46fJGxR_u8t_QckXYYaQ8YSnWYAd_zzw7NzRGLubJr5dnmg3uTCYNEyCv14x01DZTzuONup0tE6eL0R3VaACKoOgOzWzUp7tCTL3xRw5H_3hmtWTqGw9iOZCximXFfq5VhkJhXLHgHpOR6OE2SEcFdzN9ksRLZhB37odZFFwt3_T3J_Rh5XxJlmfQ42zuYauhJfQ-P-V6q3ss2FwK3tF_vmy2Zyx5PY9dxNdaFdMAOa5fHnEIX0-u5lCbaKgLeFase8gx28tokB4MsegQMN1_QXvPp9URb8A2AmSYnm50o_n6l4KaINEOQrE',
        'secret_id': 'AKIDh8Agx0NBmvGpCnKOEgwaiOm6aRBDOa83BYgE0FQKNs4dxIO4HHav_HJ0lkiE4_W3',
        'secret_key': 'e4NReMhPM+VTX8XzV8jgPwgE8fuJTbiaUevtdAlObd4=',
        'cos_key': '5/dzEZKa8CwRJyne1aSN7N4D/file_manager/01a037d5b8de74298fd583ee8d5f11f6.md',
    },
    {
        'name': '地图_深海明珠_Pearl', 'local': '地图_深海明珠_Pearl.md',
        'media_id': 'markdown_280da25f5305f3e507747d46abb59da7_cac6c5310ed55127b1925c9d6caab0377497915668919346',
        'token': '4AnAcXfNarCEzVFhApsoNqJ0xV3q1mKaf38bcc1739ed636d4669018160a3e965X2_YZx7Mj8gDStSHezWXT8QYWzf7j0Tt0RLSqUSIB7HFWh7KGcngUDLIvcYH-XBsiKukdp0d7Y90il3eyW86i5wdgIDhrBAfPPc2lb3a0ULgOYUuhQcI-GPWtJ05wszIEFRdyL7JBP4u3QYVl7mrOGS-XWYdW91m6A_MYQ1GchtzqL1JRew3ZvKEqjsULRkGEbdAu2KP0RGUBtXgBVYhTP2o5yvhkUmmti_-2VyDL2aYQHbiOL9f953uzuy2aVWBPqCJ2lOznnMjeNcr_9gYypENMW21rcYGtbrn9ip_5ThK_Fhqp0E1ReR8btATBnSUvN0gnghcvhMXHbvQnpbZsF1w8DwKMRtgzkh4nV7mAmbqRY30bxIVd0c_ZQq9SJ6t-ZQj4sqR5v4lnZtsgdo8v7djYp4SiwgUc7mz4TE8_rSNzKYwRJQHLN9mEGLZaBcWulhEWe8Et6FGqFRFDFJtilFEPNrInMtxKEpRcax9E0HvGiqKGfnjeQmgpnVcsZpZJiao9UwXSPznMc0oF10GIxUi-QLRx6JW2lrh2_DHBnsmZ0tkCgpLSkZKeyv-2khgmy-pi4Y4uKqJtuA1irEbEWtLorZeQRjJ-0ISBpxp4K3v_3K1dhAo5WS0xNVACv10xu3ZoFHxTe6fzg8MgOwjODfZdf4k8ZAM41ydmwwYs_brSKC9dWQQa5ni_ahCQBT2VZrvPZcc6t97iluXM8tYixS32jvYivY5okjnnaxa2n0oFTC5OApWFeBB5wtL5Lc_LN7xqbxhnAU5rZkKaxuw9gxsT4_zv6lwdfmuT04vLkM',
        'secret_id': 'AKIDzuvNkS2xRPPyMZqYorvSBzGChXShkqOcczCrXqAqfq4TKh86L9rvG4ki5TYfYkNL',
        'secret_key': 'qyrIPMm8l08gUEfWQO7iy2TR6H8USfeRhWkGlnSQfmY=',
        'cos_key': '5/dzEZKa8CwRJyne1aSN7N4D/file_manager/01a037d5b8d97d5190da301c1fe17374.md',
    },
]


def upload_one(c):
    host = f"{BUCKET}.cos.{REGION}.myqcloud.com"
    uri = '/' + c['cos_key']
    key_time = f"{ST};{ET}"
    headers = {
        'Host': host,
        'Content-Type': 'text/markdown',
        'x-cos-security-token': c['token'],
    }
    auth = make_authorization(c['secret_id'], c['secret_key'], 'PUT', uri, {}, headers, key_time)
    headers['Authorization'] = auth

    local = os.path.join(OUT, c['local'])
    with open(local, 'rb') as f:
        body = f.read()

    encoded_path = '/'.join(urllib.parse.quote(seg, safe='') for seg in c['cos_key'].split('/'))
    url = f"https://{host}/{encoded_path}"
    req = urllib.request.Request(url, data=body, headers=headers, method='PUT')
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return f"OK {resp.status}\t{c['name']}\t{c['media_id']}"
    except urllib.error.HTTPError as e:
        return f"FAIL {e.code}\t{c['name']}\t{e.read().decode('utf-8', 'replace')[:200]}"
    except Exception as e:
        return f"FAIL\t{c['name']}\t{e}"


if __name__ == '__main__':
    for c in CREDS:
        print(upload_one(c))
