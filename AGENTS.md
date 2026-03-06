# LinkedFin Agent Guidelines

## Etymology Format Standard

When adding or editing name etymologies, follow this format exactly:

### Basic Format

```
From [language] word (meaning)
```

**Examples:**
- `From Turkish yaprak (leaf)`
- `From Greek σαρδέλα sardéla (pilchard)`
- `From Arabic marjān (coral)`

### Compound Names

For compound words, list each component with `+`:

```
From [language] word1 (meaning1) + word2 (meaning2)
```

**Examples:**
- `From Turkish sarı (yellow) + kanat (fin)`
- `From Arabic samak (fish) + mūsā (Moses)`
- `From Greek μέλας mélas (black) + οὐρά ourá (tail)`

### Derivation Chains

When a word derives from an older form or another language, use `↳` on a new line:

```
From [language] word (meaning)
↳ From [older language] older_word (meaning)
```

**Examples:**
```
From Greek σαρδέλα sardéla (pilchard)
↳ From Latin sardina (Sardinia)
```

```
From Old Norse lax (salmon)
↳ From Proto-Germanic *lahsaz
↳ From PIE *laks- (salmon)
```

### What Goes in Notes (Not Etymology)

Move this information to the `notes` field:

1. **Literal translations**: "Literally 'black-backed'"
2. **Usage context**: "Used in Aegean/Mediterranean region"
3. **Cultural info**: "Central to Sami fishing traditions"
4. **Size/class info**: "Refers to smallest size class of bluefish"
5. **Cognates**: "Cognate with Estonian lõhi"
6. **Historical context**: "Not native - farmed in Marmara region"
7. **Disputed origins**: "Etymology contested between Turkish and Greek origins"

### Format Checklist

✓ Meaning in parentheses: `word (meaning)` not `word meaning X`
✓ No equals sign: `word (meaning)` not `word = meaning`
✓ No quotes around meaning: `(tooth)` not `("tooth")`
✓ Derivation chains use `↳` on new lines
✓ Context/cultural info in notes field
✓ Include transliteration for non-Latin scripts: `σαρδέλα sardéla`

### Validation Command

Export and review all etymologies:

```bash
sqlite3 fish.db "SELECT name || '|' || COALESCE(etymology, '') || '|' || COALESCE(notes, '') FROM names" > /tmp/etymologies.txt
```

---

## Transliteration Requirements

### Required Languages (enforced by database trigger)

**Arabic (ara)** and **Greek (ell)** names MUST have a `transliteration` field. The database will reject inserts/updates without it.

### Transliteration Standards

**Arabic** - Use DIN 31635 romanization with vowels:
- Include long vowels: ā, ī, ū
- Include emphatic consonants: ṣ, ṭ, ḍ, ẓ
- Include ʿayn: ʿ
- Include hamza: ʾ

**Examples:**
| Arabic | Transliteration |
|--------|----------------|
| سلطان ابراهيم | Sulṭān Ibrāhīm |
| حبار | Ḥabbār |
| ثعبان البحر | Thuʿbān al-baḥr |

**Greek** - Use standard romanization with accents:
- Include stress accents: á, é, í, ó, ú
- μπ at word start = b: Μπαρμπούνι → Barboúni
- μπ mid-word = mb: keep as mb
- ου = ou (not oy)
- γγ/γκ = ng/nk

**Examples:**
| Greek | Transliteration |
|-------|----------------|
| Συναγρίδα | Synagrída |
| Μπαρμπούνι | Barboúni |
| Χταπόδι | Chtapódi |

### Required for Nordic Languages

**Finnish (fin)**, **Swedish (swe)**, **Estonian (est)** names MUST have transliterations:

| Language | Conversion |
|----------|-----------|
| Finnish | ä→a, ö→o |
| Swedish | å→a, ä→a, ö→o |
| Estonian | õ→o, ä→a, ö→o, ü→u |

**Examples:**
| Original | Transliteration |
|----------|----------------|
| Särki (fin) | Sarki |
| Gädda (swe) | Gadda |
| Lõhi (est) | Lohi |

### Optional

**Turkish (tur)** and **Sami (sme)** - transliteration recommended for special characters:
- Turkish: ğ→g, ı→i, ş→s, ç→c, ö→o, ü→u
- Sami: č→c, đ→d, ŋ→n, š→s, ŧ→t, ž→z

### Not Required

**English (eng)** - Standard Latin script, no transliteration needed.
