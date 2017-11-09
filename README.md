# Translator web api

**Get a list of all supported languages**

**request**
```curl
GET /api/lang
```

**respose**
```json
{
    "status": 200,
    "languages": [
        "arabic",
        "chinese",
        "danish",
        "dutch",
        "english",
        "french",
        "german",
        "italian",
        "portuguese",
        "russian",
        "spanish"
    ]
}
```

**Get a translation**

```curl
GET /api?src=string&dst=string&req=string
```

1. src: source language, language to translate from
2. dst: target language, language to translate to
3. req: phrase to translate

**request**

```curl
GET /api?src=english&dst=french&req=bread
```

**response**

```json
{
    "status": 200,
    "data": {
        "from": "english",
        "to": "french",
        "origin": "bread",
        "translated": " pain"
    }
}
```