import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/pagination/pagination-query.dto';

export class BuscarReportesDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['todos', 'solicitante', 'institucion'])
  criterio: 'todos' | 'solicitante' | 'institucion' = 'todos';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  institucion_id?: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  fecha_desde?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  fecha_hasta?: string;
}
