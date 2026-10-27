import { Controller, Post, Body, Get, Param, Patch, ParseIntPipe } from '@nestjs/common';
import { ConocimientoTramiteService } from './conocimiento_tramite.service';
import { CreateConocimientoTramiteDto } from './dto/create-conocimiento_tramite.dto';
import { Public } from 'src/modules/auth/decorators';
import { UpdateConocimientoTramiteDto } from './dto/update-conocimiento_tramite.dto';

@Controller('conocimiento-tramite')
export class ConocimientoTramiteController {
  constructor(private readonly conocimientoTramiteService: ConocimientoTramiteService,) {}

  @Public()
  @Post()
  create(
    @Body()
    createConocimientoTramiteDto: CreateConocimientoTramiteDto,
  ) {
    return this.conocimientoTramiteService.create(
      createConocimientoTramiteDto,
    );
  }

  @Public()
  @Get('codigo/:codigo')
  consultarPorCodigo(
    @Param('codigo') codigo: string,
  ) {
    return this.conocimientoTramiteService.consultarRequisitoPorCodigo(
      codigo,
    );
  }

  @Public()
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConocimientoTramiteDto: UpdateConocimientoTramiteDto,
  ) {
    return this.conocimientoTramiteService.update(
      id,
      updateConocimientoTramiteDto,
    );
  }
}
