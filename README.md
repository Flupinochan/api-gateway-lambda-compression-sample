# API Gateway Lambda Compression Sample

API Gateway の gzip 圧縮動作確認用プロジェクト

- `GET /text`: 非圧縮 JSON レスポンス
- `GET /binary`: gzip 圧縮 + base64 エンコード JSON レスポンス

## Endpoints

| Response Type | URL Example                                                              |
| ------------- | ------------------------------------------------------------------------ |
| text          | `https://r51earz7i4.execute-api.ap-northeast-1.amazonaws.com/dev/text`   |
| binary        | `https://r51earz7i4.execute-api.ap-northeast-1.amazonaws.com/dev/binary` |

## Test Commands

### Response Body確認

```bash
# text
curl https://r51earz7i4.execute-api.ap-northeast-1.amazonaws.com/dev/text

# binary (gzip 自動展開)
curl --compressed https://r51earz7i4.execute-api.ap-northeast-1.amazonaws.com/dev/binary
```

### Response Header確認

`-sD -` でヘッダーのみ表示

```bash
# text
curl -sD - https://r51earz7i4.execute-api.ap-northeast-1.amazonaws.com/dev/text -o /dev/null

# binary
## Content-Encoding: gzip が存在
curl -sD - https://r51earz7i4.execute-api.ap-northeast-1.amazonaws.com/dev/binary --compressed -o /dev/null
```

### Binary Response圧縮率確認

```bash
compressed=$(curl -s https://r51earz7i4.execute-api.ap-northeast-1.amazonaws.com/dev/binary | wc -c)
expanded=$(curl -s --compressed https://r51earz7i4.execute-api.ap-northeast-1.amazonaws.com/dev/binary | wc -c)
echo "転送サイズ (gzip): ${compressed} bytes"
echo "展開後サイズ:       ${expanded} bytes"
awk "BEGIN {printf \"圧縮率:             %.1f%%\n\", (1 - ${compressed}/${expanded}) * 100}"
```
