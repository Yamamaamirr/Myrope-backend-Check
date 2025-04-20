import { Body, Controller, Post, Get, Param, UsePipes, HttpCode, HttpStatus, Patch, NotFoundException } from '@nestjs/common';
import { CreateGeofenceDto } from './dto/geofence.dto';
import { GeofenceService } from './geofence.service';
import { GeofenceQueryService } from './geofence-query.service';
import { GeofenceValidationPipe } from './pipes/geofence.pipe';
import { ApiResponse, ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { GeofenceResponseDto, GeofenceListResponseDto } from './dto/get-geofence.dto';
import { ValidationPipe } from '@nestjs/common';
import { UpdateGeofenceDto } from './dto/update-geofence.dto';



@ApiTags('geofence')
@Controller('geofence')
export class GeofenceController {
  constructor(
    private readonly geofenceService: GeofenceService,
    private readonly queryService: GeofenceQueryService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe(), new GeofenceValidationPipe()) // Both pipes here
  @ApiOperation({ summary: 'Create a new geofence' })
  @ApiBody({ type: CreateGeofenceDto })
  @ApiResponse({ status: 201, description: 'Geofence created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Geofence name already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createGeofence(@Body() createGeofenceDto: CreateGeofenceDto) {
    return this.geofenceService.createGeofence(createGeofenceDto);
  }
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all geofences' })
  @ApiResponse({
    status: 200,
    description: 'List of all geofences',
    type: GeofenceListResponseDto,
  })
  async getAllGeofences(): Promise<GeofenceListResponseDto> {
    return this.queryService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get geofence by ID' })
  @ApiParam({ name: 'id', description: 'Geofence ID' })
  @ApiResponse({
    status: 200,
    description: 'Geofence details',
    type: GeofenceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Geofence not found' })
  async getGeofenceById(
    @Param('id') id: string,
  ): Promise<GeofenceResponseDto> {
    return this.queryService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a geofence' })
  @ApiParam({ name: 'id', description: 'Geofence ID' })
  @ApiResponse({ status: 200, description: 'Geofence updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Geofence not found' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  async update(
    @Param('id') id: string,
    @Body(new GeofenceValidationPipe()) updateGeofenceDto: UpdateGeofenceDto,
  ) {
    return this.geofenceService.updateGeofence(id, updateGeofenceDto);
  }
}