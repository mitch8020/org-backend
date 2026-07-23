import { IsDefined, IsInt, IsObject, Min, ValidateIf } from 'class-validator';

export class SaveDraftDto {
  @IsDefined()
  @ValidateIf((value: SaveDraftDto) => value.expectedDraftRevision !== null)
  @IsInt()
  @Min(1)
  expectedDraftRevision: number | null;

  @IsObject()
  content: Record<string, unknown>;
}

export class ExpectedDraftDto {
  @IsDefined()
  @ValidateIf((value: ExpectedDraftDto) => value.expectedDraftRevision !== null)
  @IsInt()
  @Min(1)
  expectedDraftRevision: number | null;
}
