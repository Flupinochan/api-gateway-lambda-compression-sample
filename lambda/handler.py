import base64
import gzip
import json
import logging
from typing import Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

LambdaEvent = dict[str, Any]
LambdaResponse = dict[str, Any]


def lambda_handler(event: LambdaEvent, context: Any) -> LambdaResponse:
    logger.info(json.dumps(event))
    path: str = event.get("path", "/")

    if path == "/text":
        return handle_text_response()
    if path == "/binary":
        return handle_binary_response()

    return {
        "statusCode": 404,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": "Not Found"}),
        "isBase64Encoded": False,
    }


def handle_text_response() -> LambdaResponse:
    body: str = json.dumps(
        {
            "message": "This is a plain text response",
            "encoding": "none",
            "compressed": False,
        },
    )
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": body,
        "isBase64Encoded": False,
    }


def handle_binary_response() -> LambdaResponse:
    payload: bytes = json.dumps(
        {
            "message": "This is a gzip compressed binary response",
            "encoding": "gzip",
            "compressed": True,
            "data": "A" * 1000,
        },
    ).encode("utf-8")

    # gzip圧縮
    compressed: bytes = gzip.compress(payload, compresslevel=6)
    # base64でencode
    encoded: str = base64.b64encode(compressed).decode("utf-8")

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Content-Encoding": "gzip",
        },
        "body": encoded,
        "isBase64Encoded": True,
    }
