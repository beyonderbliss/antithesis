# Antithesis — Version Log

> **New sheet / lembar baru**
>
> Mulai **v1.0.0**, version log ini menjadi catatan sejarah pengembangan Antithesis setelah migrasi workflow ke GitHub.
>
> **Source of truth:** GitHub repository  
> **Runtime / test environment:** Gemini Canvas  
> **Engineering rule:** Gemini Canvas tidak digunakan untuk mengubah atau memperbaiki source. Semua perubahan source dilakukan pada GitHub, lalu Canvas hanya dipakai untuk refresh dan pengujian.

## v1.0.0 — GitHub Migration
**Date:** 2026-09-21

- Antithesis memasuki lembar pengembangan baru dengan GitHub sebagai source-of-truth engineering.
- Workflow pengembangan dipisahkan dengan jelas:
  - **GitHub** → source, history, versioning, dan perubahan code.
  - **Canvas** → runtime dan testing.
  - **Nyx** → penguji / pemilik arah proyek.
  - **Geb** → engineering, diagnosis, dan perubahan source.
- Gemini Canvas tidak lagi menjadi tempat untuk memperbaiki atau mengubah source secara manual.
- **Phase 0** membuktikan GitHub → Canvas live module loading.
- **Phase 0.5** membuktikan source Antithesis dapat dimuat langsung dari GitHub ke Canvas, termasuk Babel bridge dan Lucide React runtime bridge.
- Version log di-reset ke **v1.0.0** sebagai titik awal lembar baru.
- Semua update berikutnya harus ditambahkan di bawah versi ini secara berurutan.

## Maintenance Rule

Setiap perubahan penting pada Antithesis harus menambahkan satu entry baru ke file ini dengan:

1. version
2. date
3. ringkasan perubahan
4. dampak terhadap architecture/runtime bila relevan
5. catatan migrasi atau compatibility bila relevan

Jangan menghapus history versi sebelumnya. File ini adalah **living changelog** untuk lembar GitHub Migration.
