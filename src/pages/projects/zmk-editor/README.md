# ZMK editor — Vim register pass

Complete editor feature plus the shared storage dependency it consumes.

## Motions

```text
h j k l / arrows   navigate keys
0 / _              first key on row
$                  last key on row
n / N              next / previous layer, wrapping

i                  edit binding, selecting the current value
r                  replace binding with "&" and continue typing
a                  edit display-label override
Esc                return to key navigation
Enter              edit the next key's binding

y                  persist selected key in the ZMK register
x / d              persist selected key, then make it transparent
p                  paste the persisted key onto the selected key
```

The register stores the binding and presentation overrides. Its metadata records
the action, source layer/key, layout identity, key count, and capture time. It is
persistent site storage and never touches the system clipboard.

`VIM_MOTIONS_ENABLED` in `ZmkEditorPage.tsx` is currently `true`. The hook already
accepts an `enabled` value, so a visible preference can replace the constant later.
